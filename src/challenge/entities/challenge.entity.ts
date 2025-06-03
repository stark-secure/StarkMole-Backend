import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { GameSession } from '../../game-session/entities/game-session.entity';

export enum ChallengeDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

@Entity('challenges')
@Unique(['date'])
export class Challenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  pattern: string; // JSON or encoded string representing mole positions

  @Column({
    type: 'enum',
    enum: ChallengeDifficulty,
    default: ChallengeDifficulty.MEDIUM,
  })
  difficulty: ChallengeDifficulty;

  @Column({ type: 'date', unique: true })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GameSession, (gameSession) => gameSession.challenge)
  gameSessions: GameSession[];
}
