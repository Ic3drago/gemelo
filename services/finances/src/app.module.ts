import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { Goal } from './entities/goal.entity';
import { Budget } from './entities/budget.entity';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'finances_db',
      entities: [Account, Transaction, Goal, Budget],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Account, Transaction, Goal, Budget]),
  ],
  controllers: [FinancesController],
  providers: [FinancesService, RabbitMQService],
})
export class AppModule {}
