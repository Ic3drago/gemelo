import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CarbonFactor } from './carbon-factor.vo';

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

  /**
   * Comportamiento de dominio: calcula y asigna la huella de CO₂ y el costo
   * a partir del consumo en kWh, usando el factor por defecto (o uno custom).
   * Este método debe llamarse antes de persistir la entidad.
   */
  applyCarbon(factor: CarbonFactor = CarbonFactor.default()): void {
    const kwh = Number(this.kWh);
    this.co2EstimateKg = factor.computeCo2(kwh);
    this.costBs = factor.computeCost(kwh);
  }

  /** Retorna true si el consumo se considera eficiente (< 5 kWh) */
  isEfficientReading(): boolean {
    return Number(this.kWh) < 5;
  }
}
