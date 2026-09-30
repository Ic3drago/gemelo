import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('food_reminders')
export class FoodReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'hogar_001' })
  householdId: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  expiresAt: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
