import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/** Tipos válidos de transacción — reemplaza el string libre con comentario */
export type TransactionType = 'income' | 'expense';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  /** 'income' | 'expense' — validado en el service antes de persistir */
  @Column()
  type: TransactionType;

  @Column()
  category: string;

  @Column({ default: false })
  isRecurring: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
