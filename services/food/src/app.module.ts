import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { RabbitMQService } from './rabbitmq.service';
import { Food } from './food.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'food_db',
      entities: [Food],
      synchronize: true, // auto-sync schema for dev
    }),
    TypeOrmModule.forFeature([Food]),
  ],
  controllers: [FoodController],
  providers: [FoodService, RabbitMQService],
})
export class AppModule {}
