import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Goal } from './entities/goal.entity';
import { Budget } from './entities/budget.entity';
import { RabbitMQService } from './rabbitmq.service';

const VALID_TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

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

  // ─── Account ──────────────────────────────────────────────────────────────

  async getAccounts(): Promise<Account[]> {
    return this.accountRepo.find();
  }

  async createAccount(data: Partial<Account>): Promise<Account> {
    const acc = this.accountRepo.create(data);
    return this.accountRepo.save(acc);
  }

  // ─── Transaction ──────────────────────────────────────────────────────────

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.find({ order: { timestamp: 'DESC' } });
  }

  /**
   * Registra una transacción y actualiza el balance de la cuenta.
   * La mutación del balance se delega al agregado Account, que contiene
   * las invariantes (monto positivo, saldo suficiente para egresos).
   */
  async addTransaction(data: Partial<Transaction>): Promise<Transaction> {
    // Validar tipo antes de cualquier operación
    const type = data.type as TransactionType;
    if (!VALID_TRANSACTION_TYPES.includes(type)) {
      throw new BadRequestException(
        `Tipo de transacción inválido: "${data.type}". Use "income" o "expense".`,
      );
    }

    const tx = this.transactionRepo.create(data);
    const saved = await this.transactionRepo.save(tx);

    // Actualizar balance a través del comportamiento del agregado Account
    if (data.accountId) {
      const acc = await this.accountRepo.findOne({ where: { id: data.accountId } });
      if (!acc) {
        throw new NotFoundException(`Cuenta con id ${data.accountId} no encontrada`);
      }

      // La regla de negocio vive en el agregado, no aquí
      try {
        acc.applyTransaction(type, Number(data.amount));
      } catch (e) {
        throw new BadRequestException(e.message);
      }

      await this.accountRepo.save(acc);
    }

    await this.rabbitService.publish('finance.transaction.added', saved);
    return saved;
  }

  // ─── Goal ─────────────────────────────────────────────────────────────────

  async getGoals(): Promise<Goal[]> {
    return this.goalRepo.find();
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const goal = this.goalRepo.create(data);
    return this.goalRepo.save(goal);
  }

  // ─── Budget ───────────────────────────────────────────────────────────────

  async getBudgets(): Promise<Budget[]> {
    return this.budgetRepo.find();
  }

  async createBudget(data: Partial<Budget>): Promise<Budget> {
    const budget = this.budgetRepo.create(data);
    return this.budgetRepo.save(budget);
  }
}
