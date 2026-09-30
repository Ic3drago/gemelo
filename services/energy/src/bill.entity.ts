import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('electricity_bills')
@Index(['householdId', 'month'], { unique: true })
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  @Column({ length: 7 })
  month: string;

  @Column('decimal', { precision: 10, scale: 3 })
  kWh: number;

  @Column('jsonb')
  tiers: Array<{ limit: number | null; rate: number; kWh: number; chargeBs: number }>;

  @Column('decimal', { precision: 10, scale: 2 })
  tieredChargeBs: number;

  @Column('decimal', { precision: 10, scale: 2 })
  fixedChargeBs: number;

  @Column('decimal', { precision: 10, scale: 2 })
  publicLightingBs: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalBs: number;

  @Column('decimal', { precision: 10, scale: 2 })
  co2Kg: number;

  @CreateDateColumn()
  createdAt: Date;
}