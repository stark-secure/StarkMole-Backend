import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Badge } from './badge.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
@Index(['userId'])
@Index(['badgeId'])
@Index(['awardedAt'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  badgeId: string;

  @ManyToOne(() => User, (user) => user.userBadges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.userBadges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @Column({ nullable: true })
  awardedBy: string;

  @Column({ default: false })
  isManuallyAwarded: boolean;

  @Column('jsonb', { nullable: true })
  metadata: {
    gameId?: string;
    score?: number;
    context?: string;
    triggerEvent?: string;
    additionalData?: Record<string, any>;
  };

  @Column({ default: false })
  isDisplayed: boolean;

  @CreateDateColumn()
  awardedAt: Date;
}
