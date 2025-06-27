import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserBadge } from './user-badge.entity';

export enum AchievementType {
  GAMEPLAY = 'gameplay',
  SOCIAL = 'social',
  EVENT_BASED = 'event_based',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface BadgeCriteria {
  condition: string;
  value?: number;
  operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  field?: string;
  metadata?: Record<string, any>;
}

@Entity('badges')
@Index(['type', 'isActive'])
@Index(['isAutoAwarded', 'isActive'])
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255 })
  icon: string;

  @Column({
    type: 'enum',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column({
    type: 'enum',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
  })
  rarity: BadgeRarity;

  @Column('jsonb', { nullable: true })
  criteria: BadgeCriteria;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAutoAwarded: boolean;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  category: string;

  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
