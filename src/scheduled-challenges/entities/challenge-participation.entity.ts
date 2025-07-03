import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { DailyChallenge } from './daily-challenge.entity';

@Entity('challenge_participations')
@Index(['challengeId', 'playerId'], { unique: true })
@Index(['challengeId', 'score'])
export class ChallengeParticipation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  challengeId: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({ type: 'integer', nullable: true })
  completionTime: number; // in seconds

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    attempts?: number;
    maxCombo?: number;
    accuracy?: number;
  };

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'integer', nullable: true })
  rank: number;

  @ManyToOne(() => DailyChallenge, (challenge) => challenge.participations)
  @JoinColumn({ name: 'challengeId' })
  challenge: DailyChallenge;

  @CreateDateColumn()
  createdAt: Date;
}
