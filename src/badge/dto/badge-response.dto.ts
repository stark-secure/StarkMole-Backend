import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AchievementType, BadgeRarity } from '../entities/badge.entity';

export class BadgeResponseDto {
  @ApiProperty({
    description: 'Badge unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Badge name',
    example: 'First Victory',
  })
  name: string;

  @ApiProperty({
    description: 'Badge description',
    example: 'Awarded for winning your first game',
  })
  description: string;

  @ApiProperty({
    description: 'Badge icon URL or identifier',
    example: 'trophy-gold.svg',
  })
  icon: string;

  @ApiProperty({
    description: 'Type of achievement',
    enum: [
      'GAME_COMPLETION',
      'SCORE_MILESTONE',
      'STREAK',
      'TIME_BASED',
      'SPECIAL',
    ],
    example: 'GAME_COMPLETION',
  })
  type: AchievementType;

  @ApiProperty({
    description: 'Badge rarity level',
    enum: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'],
    example: 'RARE',
  })
  rarity: BadgeRarity;

  @ApiProperty({
    description: 'Points awarded for this badge',
    example: 100,
  })
  points: number;

  @ApiPropertyOptional({
    description: 'Badge category',
    example: 'Achievement',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Date when badge was awarded',
    example: '2024-01-15T10:30:00Z',
  })
  awardedAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether badge was manually awarded',
    example: false,
  })
  isManuallyAwarded?: boolean;

  @ApiPropertyOptional({
    description: 'Additional badge metadata',
    example: { level: 5, gameType: 'mole-hunt' },
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Badge progress information',
    example: { current: 7, required: 10, percentage: 70 },
  })
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
}

export class UserProfileBadgesDto {
  @ApiProperty({
    description: 'Total number of badges earned',
    example: 15,
  })
  totalBadges: number;

  @ApiProperty({
    description: 'Total points from all badges',
    example: 1500,
  })
  totalPoints: number;

  @ApiProperty({
    description: 'Number of badges by rarity',
    example: { COMMON: 8, RARE: 5, EPIC: 2, LEGENDARY: 0 },
  })
  badgesByRarity: Record<BadgeRarity, number>;

  @ApiProperty({
    description: 'Recently earned badges',
    type: [BadgeResponseDto],
  })
  recentBadges: BadgeResponseDto[];

  @ApiProperty({
    description: 'Featured badges for display',
    type: [BadgeResponseDto],
  })
  featuredBadges: BadgeResponseDto[];
}

export class LeaderboardEntryDto {
  userId: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  badgeCount: number;
  badgePoints: number;
  topBadges: BadgeResponseDto[];
  rank: number;
}
