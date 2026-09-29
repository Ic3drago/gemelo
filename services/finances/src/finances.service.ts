import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { Goal } from './entities/goal.entity';
import { Budget } from './entities/budget.entity';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class FinancesService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    private readonly rabbitService: RabbitMQService,
  ) {}

  // Account
  async getAccounts(): Promise<Account[]> {
    return this.accountRepo.find();
  }
  async createAccount(data: Partial<Account>): Promise<Account> {
    const acc = this.accountRepo.create(data);
    return this.accountRepo.save(acc);
  }

  // Transaction
  async getTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.find({ order: { timestamp: 'DESC' } });
  }
  async addTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const tx = this.transactionRepo.create(data);
    const saved = await this.transactionRepo.save(tx);
    // Update balance
    if (data.accountId) {
      const acc = await this.accountRepo.findOne({ where: { id: data.accountId } });
      if (acc) {
        if (data.type === 'income') {
          acc.balance = Number(acc.balance) + Number(data.amount);
        } else {
          acc.balance = Number(acc.balance) - Number(data.amount);
        }
        await this.accountRepo.save(acc);
      }
    }
    await this.rabbitService.publish('finance.transaction.added', saved);
    return saved;
  }

  // Goal
  async getGoals(): Promise<Goal[]> {
    return this.goalRepo.find();
  }
  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const goal = this.goalRepo.create(data);
    return this.goalRepo.save(goal);
  }

  // Budget
  async getBudgets(): Promise<Budget[]> {
    return this.budgetRepo.find();
  }
  async createBudget(data: Partial<Budget>): Promise<Budget> {
    const budget = this.budgetRepo.create(data);
    return this.budgetRepo.save(budget);
  }
}
