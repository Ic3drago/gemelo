import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationProfile } from './entities/profile.entity';
import { Achievement } from './entities/achievement.entity';
import { PointsLog } from './entities/points-log.entity';
import { GamificationService } from './gamification.service';
import { EventConsumerService } from './event-consumer.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'gamification_db',
      entities: [GamificationProfile, Achievement, PointsLog],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([GamificationProfile, Achievement, PointsLog]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, EventConsumerService],
})
export class AppModule {}
