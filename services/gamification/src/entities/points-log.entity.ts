import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('points_log')
export class PointsLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  householdId: string;

  @Column()
  points: number;

  @Column()
  reason: string;

  @Column({ nullable: true })
  eventType: string;

  @CreateDateColumn()
  timestamp: Date;
}
