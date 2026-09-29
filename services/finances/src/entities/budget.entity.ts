import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  month: string; // YYYY-MM

  @Column('decimal', { precision: 10, scale: 2 })
  needsLimit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  wantsLimit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  savingsTarget: number;
}
