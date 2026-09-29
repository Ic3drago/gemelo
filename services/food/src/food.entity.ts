import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FoodStatus } from './food-status.vo';

/** kg CO₂ emitidos por cada kg de alimento desperdiciado */
const CO2_KG_PER_KG_WASTED = 2.5;

@Entity()
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantityKg: number;

  /** Persistido como string; FoodStatus valida y encapsula las transiciones */
  @Column({ default: 'stored' })
  status: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  co2EstimateKg: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Comportamiento de dominio ────────────────────────────────────────────

  /** Expone el estado actual como value object */
  getStatus(): FoodStatus {
    return FoodStatus.of(this.status);
  }

  /**
   * Transiciona el alimento a un nuevo estado aplicando todas las reglas
   * de negocio asociadas (validación de transición, cálculo de CO₂).
   *
   * @throws Error si la transición no está permitida
   */
  transitionTo(next: FoodStatus): void {
    const current = this.getStatus();
    if (!current.canTransitionTo(next)) {
      throw new Error(
        `Transición inválida: "${current.value}" → "${next.value}". ` +
        `Un alimento ${current.value} no puede cambiar a ${next.value}.`,
      );
    }

    this.status = next.value;

    // Regla de negocio: solo el desperdicio genera huella de CO₂
    if (next.isWasted()) {
      this.co2EstimateKg = Number(this.quantityKg) * CO2_KG_PER_KG_WASTED;
    }
  }

  /** Indica si el alimento está actualmente en inventario */
  isAvailable(): boolean {
    return this.getStatus().isStored();
  }
}
