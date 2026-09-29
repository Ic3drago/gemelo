import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('gamification_profiles')
export class GamificationProfile {
  @PrimaryColumn()
  householdId: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 'Principiante' })
  levelName: string;

  @Column({ nullable: true })
  weeklyChallenge: string;

  @Column({ type: 'int', default: 0 })
  weeklyChallengeProgress: number;

  @Column({ type: 'int', default: 100 })
  weeklyChallengeTarget: number;
}
