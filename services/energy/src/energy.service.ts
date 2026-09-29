import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReading } from './energy-reading.entity';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(EnergyReading)
    private readonly repository: Repository<EnergyReading>,
  ) {}

  async create(data: Partial<EnergyReading>): Promise<EnergyReading> {
    const reading = this.repository.create(data);
    return await this.repository.save(reading);
  }

  async findAll(filters: { householdId?: string; from?: string; to?: string; deviceType?: string }): Promise<EnergyReading[]> {
    const query = this.repository.createQueryBuilder('reading');
    
    if (filters.householdId) {
      query.andWhere('reading.householdId = :householdId', { householdId: filters.householdId });
    }
    if (filters.deviceType) {
      query.andWhere('reading.deviceType = :deviceType', { deviceType: filters.deviceType });
    }
    if (filters.from) {
      query.andWhere('reading.timestamp >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('reading.timestamp <= :to', { to: filters.to });
    }
    
    query.orderBy('reading.timestamp', 'DESC');
    return await query.getMany();
  }

  async getSummary(householdId?: string) {
    const query = this.repository.createQueryBuilder('reading')
      .select("TO_CHAR(reading.timestamp, 'YYYY-MM')", 'month')
      .addSelect('SUM(reading.kWh)', 'totalKwh')
      .addSelect('SUM(reading.costBs)', 'totalCostBs')
      .addSelect('SUM(reading.co2EstimateKg)', 'totalCo2')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(reading.timestamp, 'YYYY-MM')")
      .orderBy("TO_CHAR(reading.timestamp, 'YYYY-MM')", 'ASC');

    if (householdId) {
      query.where('reading.householdId = :householdId', { householdId });
    }

    const rawResults = await query.getRawMany();

    let totalKwh = 0;
    let totalCo2 = 0;
    let totalCostBs = 0;
    const summary = rawResults.map(row => {
      const kwh = parseFloat(row.totalKwh) || 0;
      const co2 = parseFloat(row.totalCo2) || 0;
      const cost = parseFloat(row.totalCostBs) || 0;
      totalKwh += kwh;
      totalCo2 += co2;
      totalCostBs += cost;
      return { month: row.month, totalKwh: kwh, totalCostBs: cost, totalCo2: co2, count: parseInt(row.count) || 0 };
    });

    return { summary, totalKwh, totalCo2, totalCostBs };
  }
}
