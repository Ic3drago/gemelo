import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // cash, bank, savings

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;
}
