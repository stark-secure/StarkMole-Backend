import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { GameSession } from './game-session.entity';

export enum InputEventType {
  HIT = 'hit',
  MISS = 'miss',
  CLICK = 'click',
  KEYPRESS = 'keypress',
  MOVE = 'move',
}

@Entity('input_events')
@Index(['gameSessionId', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class InputEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  gameSessionId: string;

  @Column({
    type: 'enum',
    enum: InputEventType,
  })
  eventType: InputEventType;

  @Column('bigint', { comment: 'Timestamp in milliseconds' })
  timestamp: number;

  @Column('jsonb')
  eventData: {
    x?: number;
    y?: number;
    key?: string;
    target?: string;
    accuracy?: number;
    [key: string]: any;
  };

  @Column('varchar', { length: 128, nullable: true })
  clientId: string; // For client verification

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => GameSession, (gameSession) => gameSession.inputs, {
    onDelete: 'CASCADE',
  })
  gameSession: GameSession;
}
