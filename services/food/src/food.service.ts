import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from './food.entity';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(
    @InjectRepository(Food)
    private readonly foodRepo: Repository<Food>,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  async create(data: Partial<Food>): Promise<Food> {
    const food = this.foodRepo.create({
      ...data,
      status: 'stored',
    });
    return this.foodRepo.save(food);
  }

  async findAll(householdId?: string, status?: string): Promise<Food[]> {
    const where: any = {};
    if (householdId) where.householdId = householdId;
    if (status) where.status = status;
    return this.foodRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: string): Promise<Food> {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`Food with id ${id} not found`);
    }

    food.status = status;

    if (status === 'wasted') {
      food.co2EstimateKg = Number(food.quantityKg) * 2.5;
    }

    const saved = await this.foodRepo.save(food);

    // Publish event
    if (status === 'wasted') {
      await this.rabbitmq.publish('food.wasted', {
        householdId: saved.householdId,
        foodId: saved.id,
        name: saved.name,
        category: saved.category,
        quantityKg: Number(saved.quantityKg),
        co2EstimateKg: Number(saved.co2EstimateKg),
        timestamp: new Date().toISOString(),
      });
    } else if (status === 'consumed') {
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
      totalWasteKg += Number(item.quantityKg);
      totalWasteCo2 += Number(item.co2EstimateKg);

      const month = item.updatedAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, totalKg: 0, totalCo2: 0, count: 0 });
      }
      const data = monthlyMap.get(month);
      data.totalKg += Number(item.quantityKg);
      data.totalCo2 += Number(item.co2EstimateKg);
      data.count += 1;
    }

    const summary = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return {
      summary,
      totalWasteKg,
      totalWasteCo2,
    };
  }
}
