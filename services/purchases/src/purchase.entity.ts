import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { PurchaseCategory } from './purchase-category.vo';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  /** Persistido como string; el value object PurchaseCategory valida el valor */
  @Column()
  category: string;

  @Column()
  item: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountBs: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  co2EstimateKg: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @CreateDateColumn()
  timestamp: Date;

  /**
   * Comportamiento de dominio: calcula y asigna la huella de CO₂
   * usando el value object PurchaseCategory.
   * Debe llamarse antes de persistir la entidad.
   */
  applyCarbon(): void {
    const cat = PurchaseCategory.of(this.category);
    this.co2EstimateKg = cat.computeCo2(Number(this.amountBs));
  }

  /** Expone la categoría como value object para lógica de dominio */
  getCategory(): PurchaseCategory {
    return PurchaseCategory.of(this.category);
  }
}
