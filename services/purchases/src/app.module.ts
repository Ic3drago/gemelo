import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './purchase.entity';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'purchases_db',
      entities: [Purchase],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Purchase]),
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService, RabbitMQService],
})
export class AppModule {}
