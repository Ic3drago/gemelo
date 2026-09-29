import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  type: string; // income, expense

  @Column()
  category: string;

  @Column({ default: false })
  isRecurring: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
