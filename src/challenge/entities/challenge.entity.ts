import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GameSession } from '../../game-session/entities/game-session.entity';

export enum ChallengeType {
  MOLE_HUNT = 'mole_hunt',
  TIME_ATTACK = 'time_attack',
  PRECISION = 'precision',
  SURVIVAL = 'survival',
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

@Entity('challenges')
@Index(['type', 'difficulty'])
@Index(['isActive'])
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ChallengeType,
    default: ChallengeType.MOLE_HUNT,
  })
  type: ChallengeType;

  @Column({
    type: 'enum',
    enum: ChallengeDifficulty,
    default: ChallengeDifficulty.MEDIUM,
  })
  difficulty: ChallengeDifficulty;

  @Column('jsonb', { nullable: true })
  settings: {
    timeLimit?: number; // in milliseconds
    targetCount?: number;
    speed?: number;
    size?: number;
    [key: string]: any;
  };

  @Column('integer', { default: 0 })
  maxScore: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('integer', { default: 0 })
  playCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GameSession, (gameSession) => gameSession.challenge)
  gameSessions: GameSession[];
}
