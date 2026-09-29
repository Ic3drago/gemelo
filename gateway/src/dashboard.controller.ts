import { Controller, Get, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller()
export class DashboardController {
  constructor(private readonly httpService: HttpService) {}

  @Get('api/dashboard')
  async getDashboard(@Query('householdId') householdId: string) {
    if (!householdId) {
      return { error: 'householdId is required' };
    }

    const requests = [
      this.httpService.axiosRef.get(`${process.env.PURCHASES_URL}/purchases/summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.ENERGY_URL}/energy/summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.FOOD_URL}/food/waste-summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.GAMIFICATION_URL}/gamification/profile/${householdId}`).then(res => res.data)
    ];

    const results = await Promise.allSettled(requests);

    return {
      purchases: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason?.message },
      energy: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message },
      food: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason?.message },
      gamification: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason?.message },
      timestamp: new Date()
    };
  }

  @Get('api/health')
  getHealth() {
    return { status: 'ok', service: 'gateway' };
  }
}
