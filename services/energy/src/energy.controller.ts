import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { RabbitMQService } from './rabbitmq.service';

@Controller('energy')
export class EnergyController {
  constructor(
    private readonly service: EnergyService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  @Post('readings')
  async create(@Body() body: any) {
    const co2EstimateKg = body.kWh * 0.5;
    const data = { ...body, co2EstimateKg };
    const saved = await this.service.create(data);
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

  @Get('readings')
  async findAll(
    @Query('householdId') householdId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('deviceType') deviceType: string,
  ) {
    return await this.service.findAll({ householdId, from, to, deviceType });
  }

  @Get('summary')
  async getSummary(@Query('householdId') householdId?: string) {
    return await this.service.getSummary(householdId);
  }
}

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'energy-svc' };
  }
}
