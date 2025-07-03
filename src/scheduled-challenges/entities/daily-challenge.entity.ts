import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChallengeParticipation } from './challenge-participation.entity';

@Entity('daily_challenges')
export class DailyChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp with time zone' })
  startAt: Date;

  @Column({ type: 'timestamp with time zone' })
  endAt: Date;

  @Column({ type: 'varchar', length: 255 })
  objective: string;

  @Column({ type: 'jsonb' })
  reward: {
    type: 'coins' | 'experience' | 'item';
    amount: number;
    itemId?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    targetScore?: number;
    targetTime?: number;
    gameMode?: string;
    difficulty?: string;
  };

  @OneToMany(
    () => ChallengeParticipation,
    (participation) => participation.challenge,
  )
  participations: ChallengeParticipation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
