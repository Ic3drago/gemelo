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

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.foodService.updateStatus(id, status);
  }
}

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
