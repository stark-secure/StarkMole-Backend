import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Mint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  transactionHash: string;
}