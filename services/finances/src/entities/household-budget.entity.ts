import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('household_budgets')
export class HouseholdBudget {
  @PrimaryColumn({ default: 'hogar_001' })
  householdId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  income: number;

  @UpdateDateColumn()
  updatedAt: Date;
}