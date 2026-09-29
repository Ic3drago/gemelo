import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationProfile } from './entities/profile.entity';
import { Achievement } from './entities/achievement.entity';
import { PointsLog } from './entities/points-log.entity';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(GamificationProfile)
    private profileRepo: Repository<GamificationProfile>,
    @InjectRepository(Achievement)
    private achievementRepo: Repository<Achievement>,
    @InjectRepository(PointsLog)
    private pointsLogRepo: Repository<PointsLog>,
  ) {}

  async getOrCreateProfile(householdId: string): Promise<GamificationProfile> {
    let profile = await this.profileRepo.findOne({ where: { householdId } });
    if (!profile) {
      profile = this.profileRepo.create({ householdId });
      await this.profileRepo.save(profile);
      await this.initDefaultAchievements(householdId);
    }
    return profile;
  }

  async awardPoints(householdId: string, points: number, reason: string, eventType: string) {
    const profile = await this.getOrCreateProfile(householdId);
    profile.points += points;

    // Recalculate level
    if (profile.points >= 1501) {
      profile.level = 4;
      profile.levelName = 'Campeón Sostenible';
    } else if (profile.points >= 501) {
      profile.level = 3;
      profile.levelName = 'Eco-Guerrero';
    } else if (profile.points >= 101) {
      profile.level = 2;
      profile.levelName = 'Consciente';
    } else {
      profile.level = 1;
      profile.levelName = 'Principiante';
    }

    if (points > 0 && profile.weeklyChallengeProgress < profile.weeklyChallengeTarget) {
      profile.weeklyChallengeProgress += points;
      if (profile.weeklyChallengeProgress > profile.weeklyChallengeTarget) {
        profile.weeklyChallengeProgress = profile.weeklyChallengeTarget;
      }
    }

    await this.profileRepo.save(profile);

    const log = this.pointsLogRepo.create({ householdId, points, reason, eventType });
    await this.pointsLogRepo.save(log);

    await this.checkAchievements(householdId, profile);
  }

  async getProfile(householdId: string) {
    const profile = await this.getOrCreateProfile(householdId);
    const achievements = await this.getAchievements(householdId);
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    return { ...profile, unlockedAchievements };
  }

  async getAchievements(householdId: string) {
    await this.getOrCreateProfile(householdId); // ensure initialized
    return this.achievementRepo.find({ where: { householdId } });
  }

  async getPointsHistory(householdId: string) {
    return this.pointsLogRepo.find({
      where: { householdId },
      order: { timestamp: 'DESC' },
      take: 50,
    });
  }

  async checkAchievements(householdId: string, profile?: GamificationProfile) {
    if (!profile) {
      profile = await this.getOrCreateProfile(householdId);
    }
    const achievements = await this.achievementRepo.find({ where: { householdId, isUnlocked: false } });

    for (const ach of achievements) {
      let unlock = false;
      switch (ach.condition) {
        case 'points_100':
          if (profile.points >= 100) unlock = true;
          break;
        case 'level_3':
          if (profile.level >= 3) unlock = true;
          break;
        case 'level_4':
          if (profile.level >= 4) unlock = true;
          break;
      }

      if (unlock) {
        ach.isUnlocked = true;
        ach.unlockedAt = new Date();
        await this.achievementRepo.save(ach);
      }
    }
  }

  async initDefaultAchievements(householdId: string) {
    const defaultAchievements = [
      { name: 'Primera compra registrada', icon: '🛒', condition: 'first_purchase', description: 'Registra tu primera compra' },
      { name: 'Cero desperdicio en un día', icon: '🌱', condition: 'zero_waste_day', description: 'Logra cero desperdicio de alimentos en un día' },
      { name: 'Semana consciente', icon: '🌿', condition: 'conscious_week', description: 'Mantén hábitos sostenibles por una semana' },
      { name: 'Ahorro energético', icon: '⚡', condition: 'energy_saver', description: 'Logra un consumo de energía bajo' },
      { name: 'Eco-Guerrero', icon: '🛡️', condition: 'level_3', description: 'Alcanza el nivel Eco-Guerrero' },
      { name: 'Primera simulación', icon: '🔮', condition: 'first_simulation', description: 'Realiza tu primera simulación' },
      { name: '100 puntos', icon: '💯', condition: 'points_100', description: 'Acumula 100 puntos' },
      { name: 'Campeón Sostenible', icon: '🏆', condition: 'level_4', description: 'Alcanza el nivel Campeón Sostenible' },
    ];

    for (const def of defaultAchievements) {
      const exists = await this.achievementRepo.findOne({ where: { householdId, condition: def.condition } });
      if (!exists) {
        const ach = this.achievementRepo.create({ ...def, householdId });
        await this.achievementRepo.save(ach);
      }
    }
  }
}
