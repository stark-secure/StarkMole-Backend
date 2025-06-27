import type { AchievementType, BadgeRarity } from '../entities/badge.entity';

export class BadgeResponseDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  rarity: BadgeRarity;
  points: number;
  category?: string;
  awardedAt?: Date;
  isManuallyAwarded?: boolean;
  metadata?: any;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
}

export class UserProfileBadgesDto {
  totalBadges: number;
  totalPoints: number;
  badgesByRarity: Record<BadgeRarity, number>;
  recentBadges: BadgeResponseDto[];
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
