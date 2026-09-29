import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/** Tipos de cuenta válidos */
export type AccountType = 'cash' | 'bank' | 'savings';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Persistido como string; AccountType restringe los valores válidos */
  @Column()
  type: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  // ─── Comportamiento de dominio ────────────────────────────────────────────

  /**
   * Aplica un ingreso al balance.
   * @throws Error si el monto es negativo o cero.
   */
  applyIncome(amount: number): void {
    if (amount <= 0) {
      throw new Error(`El monto de un ingreso debe ser positivo. Recibido: ${amount}`);
    }
    this.balance = Number(this.balance) + amount;
  }

  /**
   * Aplica un egreso al balance.
   * @throws Error si el monto es negativo o cero.
   * @throws Error si el saldo resultante quedaría negativo (sin crédito).
   */
  applyExpense(amount: number): void {
    if (amount <= 0) {
      throw new Error(`El monto de un egreso debe ser positivo. Recibido: ${amount}`);
    }
    if (Number(this.balance) - amount < 0) {
      throw new Error(
        `Saldo insuficiente. Balance actual: ${this.balance} Bs, egreso solicitado: ${amount} Bs.`,
      );
    }
    this.balance = Number(this.balance) - amount;
  }

  /**
   * Punto de entrada unificado para cualquier transacción.
   * Delega a applyIncome / applyExpense según el tipo.
   */
  applyTransaction(type: 'income' | 'expense', amount: number): void {
    if (type === 'income') {
      this.applyIncome(amount);
    } else if (type === 'expense') {
      this.applyExpense(amount);
    } else {
      throw new Error(`Tipo de transacción inválido: "${type}". Use "income" o "expense".`);
    }
  }
}
