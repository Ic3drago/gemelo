import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  @Column()
  category: string; // 'mercado', 'supermercado', 'feria', 'servicios', 'transporte', 'otros'

  @Column()
  item: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountBs: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  co2EstimateKg: number;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @CreateDateColumn()
  timestamp: Date;
}
