import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from './food.entity';
import { FoodReminder } from './food-reminder.entity';
import { FoodStatus } from './food-status.vo';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepo: Repository<Food>,
    @InjectRepository(FoodReminder)
    private readonly reminderRepo: Repository<FoodReminder>,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  async create(data: Partial<Food>): Promise<Food> {
    const quantityKg = Number(data.quantityKg);
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      throw new BadRequestException('La cantidad de alimento debe ser mayor que cero.');
    }
    if (!data.name?.trim() || !data.category?.trim()) {
      throw new BadRequestException('El alimento requiere nombre y categoría.');
    }
    const createdAt = data.createdAt ? new Date(String(data.createdAt)) : undefined;
    if (createdAt && Number.isNaN(createdAt.getTime())) {
      throw new BadRequestException('La fecha de registro no es válida.');
    }
    const food = this.foodRepo.create({ ...data, createdAt, updatedAt: createdAt ?? new Date(), quantityKg, status: 'stored' });
    return this.foodRepo.save(food);
  }

  async findAll(householdId?: string, status?: string): Promise<Food[]> {
    const where: any = {};
    if (householdId) where.householdId = householdId;
    if (status) where.status = status;
    return this.foodRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * Actualiza el estado de un alimento delegando toda la lógica de negocio
   * (validación de transición + cálculo de CO₂) a la entidad Food.
   * El service solo orquesta: persiste y publica el evento de dominio.
   */
  async updateStatus(id: string, rawStatus: string, occurredAt?: string): Promise<Food> {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`Alimento con id ${id} no encontrado`);
    }

    // Validar el valor del estado a través del value object
    let nextStatus: FoodStatus;
    try {
      nextStatus = FoodStatus.of(rawStatus);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    // La entidad aplica la transición con sus propias reglas de negocio
    try {
      food.transitionTo(nextStatus);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    let eventDate = new Date();
    if (occurredAt) {
      eventDate = new Date(occurredAt);
      if (Number.isNaN(eventDate.getTime())) {
        throw new BadRequestException('La fecha de transición no es válida.');
      }
    }
    food.updatedAt = eventDate;

    const saved = await this.foodRepo.save(food);

    // Publicar el evento de dominio según el nuevo estado
    if (nextStatus.isWasted()) {
      await this.rabbitmq.publish('food.wasted', {
        householdId: saved.householdId,
        foodId: saved.id,
        name: saved.name,
        category: saved.category,
        quantityKg: Number(saved.quantityKg),
        co2EstimateKg: Number(saved.co2EstimateKg),
        timestamp: new Date().toISOString(),
      });
    } else if (nextStatus.isConsumed()) {
      await this.rabbitmq.publish('food.consumed', {
        householdId: saved.householdId,
        foodId: saved.id,
        name: saved.name,
        category: saved.category,
        quantityKg: Number(saved.quantityKg),
        timestamp: new Date().toISOString(),
      });
    }

    return saved;
  }

  async getWasteSummary(householdId?: string): Promise<any> {
    const where: any = { status: 'wasted' };
    if (householdId) where.householdId = householdId;
    const wasted = await this.foodRepo.find({ where });

    let totalWasteKg = 0;
    let totalWasteCo2 = 0;
    const monthlyMap = new Map<string, any>();

    for (const item of wasted) {
      totalWasteKg  += Number(item.quantityKg);
      totalWasteCo2 += Number(item.co2EstimateKg);

      const month = item.updatedAt.toISOString().substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, totalKg: 0, totalCo2: 0, count: 0 });
      }
      const data = monthlyMap.get(month);
      data.totalKg  += Number(item.quantityKg);
      data.totalCo2 += Number(item.co2EstimateKg);
      data.count    += 1;
    }

    const summary = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    return { summary, totalWasteKg, totalWasteCo2 };
  }

  async createReminder(data: Partial<FoodReminder>): Promise<FoodReminder> {
    const expiresAt = new Date(String(data.expiresAt ?? ''));
    if (!data.name?.trim() || Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('El recordatorio requiere nombre y fecha de vencimiento válida.');
    }
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha estimada debe ser futura.');
    }
    return this.reminderRepo.save(this.reminderRepo.create({
      ...data,
      householdId: data.householdId || 'hogar_001',
      name: data.name.trim(),
      expiresAt: expiresAt.toISOString().slice(0, 10),
      status: 'pending',
    }));
  }

  getReminders(householdId = 'hogar_001'): Promise<FoodReminder[]> {
    return this.reminderRepo.find({ where: { householdId, status: 'pending' }, order: { expiresAt: 'ASC' } });
  }
}
