import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('energy_readings')
export class EnergyReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  @Column({ default: 'general' })
  deviceType: string;

  @Column('decimal', { precision: 10, scale: 3 })
  kWh: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costBs: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  co2EstimateKg: number;

  @CreateDateColumn()
  timestamp: Date;
}
