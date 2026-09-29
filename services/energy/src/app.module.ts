import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyReading } from './energy-reading.entity';
import { EnergyService } from './energy.service';
import { EnergyController, HealthController } from './energy.controller';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'energy_db',
      entities: [EnergyReading],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([EnergyReading]),
  ],
  controllers: [EnergyController, HealthController],
  providers: [EnergyService, RabbitMQService],
})
export class AppModule {}
