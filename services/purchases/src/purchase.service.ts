import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './purchase.entity';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repository: Repository<Purchase>,
  ) {}

  async create(data: Partial<Purchase>): Promise<Purchase> {
    const purchase = this.repository.create(data);
    return await this.repository.save(purchase);
  }

  async findAll(filters: { householdId?: string; from?: string; to?: string }): Promise<Purchase[]> {
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
    return await query.getMany();
  }

  async getSummary(householdId: string) {
    const query = this.repository.createQueryBuilder('purchase')
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
    
    return await query.getRawMany();
  }
}
