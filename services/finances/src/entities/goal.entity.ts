import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  targetAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'date', nullable: true })
  targetDate: string;
}
