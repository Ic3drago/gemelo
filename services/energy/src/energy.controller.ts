import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { EnergyService } from './energy.service';

/**
 * El controller es solo la capa de presentación HTTP.
 * No contiene ninguna lógica de negocio (sin cálculos de CO₂,
 * sin magic numbers, sin llamadas directas a RabbitMQ).
 */
@Controller('energy')
export class EnergyController {
  constructor(private readonly service: EnergyService) {}

  @Post('readings')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('readings')
  async findAll(
    @Query('householdId') householdId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('deviceType') deviceType: string,
  ) {
    return this.service.findAll({ householdId, from, to, deviceType });
  }

  @Get('summary')
  async getSummary(@Query('householdId') householdId?: string) {
    return this.service.getSummary(householdId);
  }
}

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'energy-svc' };
  }
}
