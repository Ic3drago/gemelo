import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller('api')
export class ProxyController {
  constructor(private readonly httpService: HttpService) {}

  private async forward(method: string, url: string, data?: any, params?: any) {
    try {
      const response = await this.httpService.axiosRef({
        method,
        url,
        data,
        params
      });
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.message,
        details: error.response?.data
      };
    }
  }

  @Post('purchases')
  async createPurchase(@Body() body: any) {
    return this.forward('POST', `${process.env.PURCHASES_URL}/purchases`, body);
  }

  @Get('purchases')
  async getPurchases(@Query() query: any) {
    return this.forward('GET', `${process.env.PURCHASES_URL}/purchases`, undefined, query);
  }

  @Get('purchases/summary')
  async getPurchasesSummary(@Query() query: any) {
    return this.forward('GET', `${process.env.PURCHASES_URL}/purchases/summary`, undefined, query);
  }

  @Post('energy/readings')
  async createEnergyReading(@Body() body: any) {
    return this.forward('POST', `${process.env.ENERGY_URL}/energy/readings`, body);
  }

  @Get('energy/readings')
  async getEnergyReadings(@Query() query: any) {
    return this.forward('GET', `${process.env.ENERGY_URL}/energy/readings`, undefined, query);
  }

  @Get('energy/summary')
  async getEnergySummary(@Query() query: any) {
    return this.forward('GET', `${process.env.ENERGY_URL}/energy/summary`, undefined, query);
  }

  @Post('food')
  async createFood(@Body() body: any) {
    return this.forward('POST', `${process.env.FOOD_URL}/food`, body);
  }

  @Get('food')
  async getFood(@Query() query: any) {
    return this.forward('GET', `${process.env.FOOD_URL}/food`, undefined, query);
  }

  @Get('food/waste-summary')
  async getFoodWasteSummary(@Query() query: any) {
    return this.forward('GET', `${process.env.FOOD_URL}/food/waste-summary`, undefined, query);
  }

  @Patch('food/:id/status')
  async updateFoodStatus(@Param('id') id: string, @Body() body: any) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, body);
  }

  @Patch('food/:id/waste')
  async wasteFood(@Param('id') id: string) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, { status: 'wasted' });
  }

  @Patch('food/:id/consume')
  async consumeFood(@Param('id') id: string) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, { status: 'consumed' });
  }

  @Get('gamification/profile/:householdId')
  async getProfile(@Param('householdId') householdId: string) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/profile/${householdId}`);
  }

  @Get('gamification/achievements')
  async getAchievements(@Query() query: any) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/achievements`, undefined, query);
  }

  @Get('gamification/points-history/:householdId')
  async getPointsHistory(@Param('householdId') householdId: string) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/points-history/${householdId}`);
  }

  @Post('simulate')
  async simulate(@Body() body: any) {
    return this.forward('POST', `${process.env.SIMULATION_URL}/simulate`, body);
  }

  @Get('predict')
  async predict(@Query() query: any) {
    return this.forward('GET', `${process.env.SIMULATION_URL}/predict`, undefined, query);
  }

  @Post('retrain')
  async retrain() {
    return this.forward('POST', `${process.env.SIMULATION_URL}/retrain`);
  }

  // --- Invoices ---
  @Post('invoices/scan')
  async scanInvoice(@Body() body: any) {
    // Note: Assuming JSON payload or forwarding raw. If multipart is needed, this simple proxy might need raw body forwarding.
    return this.forward('POST', `${process.env.INVOICES_URL}/scan`, body);
  }

  // --- Finances ---
  @Get('finances/*')
  async getFinances(@Param('0') path: string, @Query() query: any) {
    return this.forward('GET', `${process.env.FINANCES_URL}/finances/${path}`, undefined, query);
  }

  @Post('finances/*')
  async postFinances(@Param('0') path: string, @Body() body: any) {
    return this.forward('POST', `${process.env.FINANCES_URL}/finances/${path}`, body);
  }
}
