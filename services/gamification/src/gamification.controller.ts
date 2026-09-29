import { Controller, Get, Param, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';

@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('gamification/profile/:householdId')
  getProfile(@Param('householdId') householdId: string) {
    return this.gamificationService.getProfile(householdId);
  }

  @Get('gamification/achievements')
  getAchievements(@Query('householdId') householdId: string) {
    return this.gamificationService.getAchievements(householdId);
  }

  @Get('gamification/points-history/:householdId')
  getPointsHistory(@Param('householdId') householdId: string) {
    return this.gamificationService.getPointsHistory(householdId);
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'gamification-svc' };
  }
}
