import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { FoodService } from './food.service';

/**
 * El controller es solo la capa de presentación HTTP.
 * Toda la lógica de transición de estados y CO₂ vive en la entidad Food.
 */

@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post()
  async create(@Body() body: any) {
    return this.foodService.create(body);
  }

  @Get()
  async findAll(
    @Query('householdId') householdId?: string,
    @Query('status') status?: string,
  ) {
    return this.foodService.findAll(householdId, status);
  }

  @Get('waste-summary')
  async getWasteSummary(@Query('householdId') householdId?: string) {
    return this.foodService.getWasteSummary(householdId);
  }

  @Post('reminders')
  createReminder(@Body() body: { householdId?: string; name: string; expiresAt: string }) {
    return this.foodService.createReminder(body);
  }

  @Get('reminders')
  getReminders(@Query('householdId') householdId = 'hogar_001') {
    return this.foodService.getReminders(householdId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; occurredAt?: string },
  ) {
    return this.foodService.updateStatus(id, body.status, body.occurredAt);
  }
}

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
