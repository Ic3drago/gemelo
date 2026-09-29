import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PurchaseService } from './purchase.service';

/**
 * El controller es solo la capa de presentación HTTP.
 * Toda la lógica de negocio vive en el service y en la entidad.
 */
@Controller()
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  @Post('purchases')
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('purchases')
  async findAll(
    @Query('householdId') householdId: string = 'hogar_001',
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.findAll({ householdId, from, to });
  }

  @Get('purchases/summary')
  async getSummary(@Query('householdId') householdId: string) {
    return this.service.getSummary(householdId);
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'purchases-svc' };
  }
}
