import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReading } from './energy-reading.entity';
import { Bill } from './bill.entity';
import { ElectricityTariff } from './electricity-tariff.vo';
import { CarbonFactor } from './carbon-factor.vo';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(EnergyReading)
    private readonly repository: Repository<EnergyReading>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  /**
   * Crea una lectura de energía aplicando la lógica de dominio (CO₂ y costo)
   * dentro de la entidad, y publica el evento de dominio correspondiente.
   * El controlador ya no conoce nada de CO₂ ni de RabbitMQ.
   */
  async create(data: Partial<EnergyReading>): Promise<EnergyReading> {
    if (!Number.isFinite(Number(data.kWh)) || Number(data.kWh) <= 0) {
      throw new BadRequestException('El consumo kWh debe ser mayor que cero.');
    }
    const reading = this.repository.create(data);

    // Comportamiento de dominio: la entidad calcula sus propios campos derivados
    reading.applyCarbon(CarbonFactor.default());

    const saved = await this.repository.save(reading);

    // La publicación del evento es responsabilidad del service (capa aplicación),
    // no del controller (capa presentación).
    await this.rabbitmq.publish('energy.reading', {
      readingId: saved.id,
      householdId: saved.householdId,
      deviceType: saved.deviceType,
      kWh: saved.kWh,
      costBs: saved.costBs,
      co2EstimateKg: saved.co2EstimateKg,
      timestamp: saved.timestamp,
    });

    return saved;
  }

  calculateBill(kWh: number) {
    try {
      return ElectricityTariff.calculate(Number(kWh));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createBill(data: { kWh: number; month: string; householdId?: string }) {
    const kWh = Number(data.kWh);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.month || '')) {
      throw new BadRequestException('El mes debe tener el formato YYYY-MM.');
    }
    const calculated = this.calculateBill(kWh);
    const householdId = data.householdId || 'hogar_001';
    const existingBill = await this.billRepository.findOne({ where: { householdId, month: data.month } });
    const bill = this.billRepository.create({
      ...existingBill,
      ...calculated,
      kWh,
      householdId,
      month: data.month,
    });
    const saved = await this.billRepository.save(bill);

    const [year, month] = data.month.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    let reading = await this.repository.createQueryBuilder('reading')
      .where('reading.householdId = :householdId', { householdId })
      .andWhere('reading.deviceType = :deviceType', { deviceType: 'bill' })
      .andWhere('reading.timestamp >= :start AND reading.timestamp < :end', { start, end })
      .getOne();
    if (!reading) reading = this.repository.create({ householdId, deviceType: 'bill' });
    reading.kWh = kWh;
    reading.timestamp = start;
    reading.applyCarbon(CarbonFactor.default());
    const savedReading = await this.repository.save(reading);
    await this.rabbitmq.publish('energy.reading', {
      readingId: savedReading.id,
      householdId,
      deviceType: 'bill',
      kWh,
      costBs: saved.totalBs,
      co2EstimateKg: saved.co2Kg,
      timestamp: savedReading.timestamp,
    });
    await this.rabbitmq.publish('bill.saved', {
      billId: saved.id,
      householdId,
      month: saved.month,
      kWh,
      totalBs: saved.totalBs,
      co2Kg: saved.co2Kg,
      timestamp: saved.createdAt,
    });
    return saved;
  }

  findBills(householdId?: string) {
    return this.billRepository.find({
      where: householdId ? { householdId } : {},
      order: { month: 'DESC' },
    });
  }

  async findAll(filters: {
    householdId?: string;
    from?: string;
    to?: string;
    deviceType?: string;
  }): Promise<EnergyReading[]> {
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
    return query.getMany();
  }

  async getSummary(householdId?: string) {
    const query = this.repository
      .createQueryBuilder('reading')
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

    const summary = rawResults.map((row) => {
      const kwh = parseFloat(row.totalKwh) || 0;
      const co2 = parseFloat(row.totalCo2) || 0;
      const cost = parseFloat(row.totalCostBs) || 0;
      totalKwh += kwh;
      totalCo2 += co2;
      totalCostBs += cost;
      return {
        month: row.month,
        totalKwh: kwh,
        totalCostBs: cost,
        totalCo2: co2,
        count: parseInt(row.count) || 0,
      };
    });

    return { summary, totalKwh, totalCo2, totalCostBs };
  }
}
