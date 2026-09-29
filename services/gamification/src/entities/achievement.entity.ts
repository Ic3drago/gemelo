import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  icon: string;

  @Column()
  condition: string; // machine-readable condition key

  @Column({ default: false })
  isUnlocked: boolean;

  @Column({ nullable: true })
  householdId: string;

  @Column({ type: 'timestamp', nullable: true })
  unlockedAt: Date;
}
