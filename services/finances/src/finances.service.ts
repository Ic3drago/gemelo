import { Injectable, BadRequestException, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Goal } from './entities/goal.entity';
import { Budget } from './entities/budget.entity';
import { HouseholdBudget } from './entities/household-budget.entity';
import { RabbitMQService } from './rabbitmq.service';

const VALID_TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

@Injectable()
export class FinancesService implements OnModuleInit, OnModuleDestroy {
  private recurringTimer?: ReturnType<typeof setInterval>;
  private recurringSync: Promise<void> | null = null;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(HouseholdBudget)
    private readonly householdBudgetRepo: Repository<HouseholdBudget>,
    private readonly rabbitService: RabbitMQService,
  ) {}

  onModuleInit() {
    void this.syncRecurringTransactions();
    this.recurringTimer = setInterval(() => void this.syncRecurringTransactions(), 60_000);
  }

  onModuleDestroy() {
    if (this.recurringTimer) clearInterval(this.recurringTimer);
  }

  // ─── Account ──────────────────────────────────────────────────────────────

  async getAccounts(): Promise<Account[]> {
    return this.accountRepo.find();
  }

  async createAccount(data: Partial<Account>): Promise<Account> {
    const balance = Number(data.balance ?? 0);
    if (!data.name?.trim()) {
      throw new BadRequestException('La cuenta requiere un nombre.');
    }
    if (!Number.isFinite(balance) || balance < 0) {
      throw new BadRequestException('El saldo inicial debe ser un monto igual o mayor que cero.');
    }
    if (!['cash', 'bank', 'savings'].includes(String(data.type))) {
      throw new BadRequestException('Tipo de cuenta inválido. Use cash, bank o savings.');
    }
    const acc = this.accountRepo.create(data);
    return this.accountRepo.save(acc);
  }

  // ─── Transaction ──────────────────────────────────────────────────────────

  async getTransactions(): Promise<Transaction[]> {
    await this.syncRecurringTransactions();
    return this.transactionRepo.find({ order: { timestamp: 'DESC' } });
  }

  private syncRecurringTransactions(): Promise<void> {
    if (this.recurringSync) return this.recurringSync;
    this.recurringSync = this.createMissingRecurringTransactions().catch(() => undefined).finally(() => {
      this.recurringSync = null;
    });
    return this.recurringSync;
  }

  private async createMissingRecurringTransactions(): Promise<void> {
    const recurring = await this.transactionRepo.find({ where: { isRecurring: true } });
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    for (const source of recurring) {
      const sourceMonth = new Date(source.timestamp).toISOString().slice(0, 7);
      if (sourceMonth >= currentMonth) continue;
      const occurrence = new Date(source.timestamp);
      occurrence.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), Math.min(occurrence.getUTCDate(), 28));
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

      await this.transactionRepo.manager.transaction(async (manager) => {
        const txRepo = manager.getRepository(Transaction);
        const exists = await txRepo.createQueryBuilder('tx')
          .where('tx.accountId = :accountId', { accountId: source.accountId })
          .andWhere('tx.category = :category', { category: source.category })
          .andWhere('tx.description IS NOT DISTINCT FROM :description', { description: source.description ?? null })
          .andWhere('tx.isRecurring = true')
          .andWhere('tx.timestamp >= :start AND tx.timestamp < :end', { start, end })
          .getOne();
        if (exists) return;

        const accountRepo = manager.getRepository(Account);
        const account = await accountRepo.findOne({ where: { id: source.accountId } });
        if (!account) return;
        try {
          account.applyTransaction(source.type, Number(source.amount));
        } catch {
          return;
        }
        await accountRepo.save(account);
        await txRepo.save(txRepo.create({
          accountId: source.accountId,
          description: source.description,
          amount: Number(source.amount),
          type: source.type,
          category: source.category,
          isRecurring: true,
          timestamp: occurrence,
        }));
      });
    }
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
    if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) {
      throw new BadRequestException('El monto de la transacción debe ser mayor que cero.');
    }
    if (!data.accountId) {
      throw new BadRequestException('Selecciona una cuenta para registrar la transacción.');
    }
    const rawCategory = String(data.category ?? '').trim().toLowerCase();
    const categoryAliases: Record<string, string> = { salario: 'income', alquiler: 'needs' };
    const category = categoryAliases[rawCategory] ?? rawCategory;
    if (!['needs', 'wants', 'savings', 'other', 'income'].includes(category)) {
      throw new BadRequestException('Categoría financiera inválida. Use needs, wants, savings, other o income.');
    }

    const saved = await this.transactionRepo.manager.transaction(async (manager) => {
      const tx = manager.create(Transaction, { ...data, category });

      if (data.accountId) {
        const accountRepo = manager.getRepository(Account);
        const acc = await accountRepo.findOne({ where: { id: data.accountId } });
        if (!acc) {
          throw new NotFoundException(`Cuenta con id ${data.accountId} no encontrada`);
        }

        try {
          acc.applyTransaction(type, Number(data.amount));
        } catch (e) {
          throw new BadRequestException(e.message);
        }

        await accountRepo.save(acc);
      }

      return manager.save(tx);
    });

    await this.rabbitService.publish('finance.transaction.added', saved);
    return saved;
  }

  // ─── Goal ─────────────────────────────────────────────────────────────────

  async getGoals() {
    const goals = await this.goalRepo.find();
    return goals.map((goal) => {
      const remaining = Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount));
      const days = goal.targetDate
        ? Math.max(1, Math.ceil((new Date(`${goal.targetDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000))
        : 7;
      const weeks = Math.max(1, Math.ceil(days / 7));
      return { ...goal, remainingAmount: Number(remaining.toFixed(2)), suggestedWeeklyContribution: Number((remaining / weeks).toFixed(2)) };
    });
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    if (!data.name?.trim() || !Number.isFinite(Number(data.targetAmount)) || Number(data.targetAmount) <= 0) {
      throw new BadRequestException('La meta requiere nombre y un monto objetivo mayor que cero.');
    }
    if (data.currentAmount !== undefined && (!Number.isFinite(Number(data.currentAmount)) || Number(data.currentAmount) < 0 || Number(data.currentAmount) > Number(data.targetAmount))) {
      throw new BadRequestException('El aporte actual debe estar entre cero y el monto objetivo.');
    }
    if (data.targetDate && Number.isNaN(new Date(data.targetDate).getTime())) {
      throw new BadRequestException('La fecha objetivo no es válida.');
    }
    const goal = this.goalRepo.create(data);
    return this.goalRepo.save(goal);
  }

  // ─── Budget ───────────────────────────────────────────────────────────────

  async getBudgets(): Promise<Budget[]> {
    return this.budgetRepo.find();
  }

  async createBudget(data: Partial<Budget>): Promise<Budget> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.month ?? '')) {
      throw new BadRequestException('El mes debe tener el formato YYYY-MM.');
    }
    const limits = [data.needsLimit, data.wantsLimit, data.savingsTarget].map(Number);
    if (limits.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
      throw new BadRequestException('Los tres límites del presupuesto deben ser mayores que cero.');
    }
    const budget = this.budgetRepo.create(data);
    return this.budgetRepo.save(budget);
  }

  async getHouseholdBudget(householdId = 'hogar_001') {
    const config = await this.householdBudgetRepo.findOne({ where: { householdId } });
    const income = Number(config?.income ?? 0);
    return {
      householdId,
      income,
      needsLimit: Number((income * 0.5).toFixed(2)),
      wantsLimit: Number((income * 0.3).toFixed(2)),
      savingsTarget: Number((income * 0.2).toFixed(2)),
    };
  }

  async setHouseholdBudget(data: { householdId?: string; income: number }) {
    const income = Number(data.income);
    if (!Number.isFinite(income) || income <= 0) {
      throw new BadRequestException('El ingreso mensual debe ser mayor que cero.');
    }
    const householdId = data.householdId || 'hogar_001';
    const config = this.householdBudgetRepo.create({ householdId, income });
    await this.householdBudgetRepo.save(config);
    return this.getHouseholdBudget(householdId);
  }
}
