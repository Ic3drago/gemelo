import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { RabbitMQService } from './rabbitmq.service';

@Controller()
export class PurchaseController {
  constructor(
    private readonly service: PurchaseService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  @Post('purchases')
  async create(@Body() body: any) {
    const saved = await this.service.create(body);
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

  @Get('purchases')
  async findAll(
    @Query('householdId') householdId: string = 'hogar_001',
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return await this.service.findAll({ householdId, from, to });
  }

  @Get('purchases/summary')
  async getSummary(@Query('householdId') householdId: string) {
    return await this.service.getSummary(householdId);
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'purchases-svc' };
  }
}
