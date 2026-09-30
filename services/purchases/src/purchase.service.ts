import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './purchase.entity';
import { PurchaseCategory } from './purchase-category.vo';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repository: Repository<Purchase>,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  /**
   * Crea una compra aplicando la lógica de dominio (validación de categoría
   * y cálculo de CO₂) dentro de la entidad, y publica el evento de dominio.
   */
  async create(data: Partial<Purchase>): Promise<Purchase> {
    const amountBs = Number(data.amountBs);
    if (!Number.isFinite(amountBs) || amountBs <= 0) {
      throw new BadRequestException('El monto de la compra debe ser mayor que cero.');
    }
    if (data.quantity !== undefined && (!Number.isFinite(Number(data.quantity)) || Number(data.quantity) <= 0)) {
      throw new BadRequestException('La cantidad de compra debe ser mayor que cero.');
    }

    // Validar la categoría a través del value object antes de persistir
    let category: PurchaseCategory;
    try {
      category = PurchaseCategory.of(data.category ?? '');
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    const purchase = this.repository.create({ ...data, category: category.value, amountBs });

    // Comportamiento de dominio: la entidad calcula su propia huella de CO₂
    purchase.applyCarbon();

    const saved = await this.repository.save(purchase);

    await this.rabbitmq.publish('purchase.registered', {
      purchaseId: saved.id,
      householdId: saved.householdId,
      category: saved.category,
      item: saved.item,
      amountBs: saved.amountBs,
      co2EstimateKg: saved.co2EstimateKg,
      timestamp: saved.timestamp,
    });

    return saved;
  }

  async findAll(filters: {
    householdId?: string;
    from?: string;
    to?: string;
  }): Promise<Purchase[]> {
    const query = this.repository.createQueryBuilder('purchase');

    if (filters.householdId) {
      query.andWhere('purchase.householdId = :householdId', { householdId: filters.householdId });
    }
    if (filters.from) {
      query.andWhere('purchase.timestamp >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('purchase.timestamp <= :to', { to: filters.to });
    }

    query.orderBy('purchase.timestamp', 'DESC');
    return query.getMany();
  }

  async getSummary(householdId: string) {
    const query = this.repository
      .createQueryBuilder('purchase')
      .select("TO_CHAR(purchase.timestamp, 'YYYY-MM')", 'month')
      .addSelect('purchase.category', 'category')
      .addSelect('SUM(purchase.amountBs)', 'totalBs')
      .addSelect('SUM(purchase.co2EstimateKg)', 'totalCo2Kg')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(purchase.timestamp, 'YYYY-MM')")
      .addGroupBy('purchase.category');

    if (householdId) {
      query.where('purchase.householdId = :householdId', { householdId });
    }

    return query.getRawMany();
  }
}
