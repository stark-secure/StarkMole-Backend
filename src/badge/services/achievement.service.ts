import { Injectable, Logger } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { type Badge, AchievementType } from '../entities/badge.entity';
import type { UserBadge } from '../entities/user-badge.entity';
import type { User } from '../../users/entities/user.entity';
import { type Game, GameStatus } from '../../game/entities/game.entity';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private badgeRepository: Repository<Badge>,
    private userBadgeRepository: Repository<UserBadge>,
    private userRepository: Repository<User>,
    private gameRepository: Repository<Game>,
  ) {}

  async checkAndAwardAchievements(
    userId: string,
    context?: any,
  ): Promise<UserBadge[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`User ${userId} not found for achievement check`);
      return [];
    }

    const autoAwardedBadges = await this.badgeRepository.find({
      where: { isAutoAwarded: true, isActive: true },
    });

    const newlyAwardedBadges: UserBadge[] = [];

    for (const badge of autoAwardedBadges) {
      const hasAlready = await this.userBadgeRepository.findOne({
        where: { userId, badgeId: badge.id },
      });

      if (!hasAlready && (await this.checkCriteria(user, badge, context))) {
        const userBadge = await this.awardBadgeAutomatically(
          userId,
          badge.id,
          context,
        );
        newlyAwardedBadges.push(userBadge);
        this.logger.log(`Awarded badge "${badge.name}" to user ${userId}`);
      }
    }

    return newlyAwardedBadges;
  }

  private async checkCriteria(
    user: User,
    badge: Badge,
    context?: any,
  ): Promise<boolean> {
    if (!badge.criteria) return false;

    const { condition, value, operator = 'gte', field } = badge.criteria;

    try {
      switch (condition) {
        case 'games_played':
          return this.compareValues(user.gamesPlayed, value, operator);

        case 'total_score':
          return this.compareValues(user.totalScore, value, operator);

        case 'highest_score':
          return this.compareValues(user.highestScore, value, operator);

        case 'referrals':
          return this.compareValues(user.referrals, value, operator);

        case 'current_streak':
          return this.compareValues(user.currentStreak, value, operator);

        case 'longest_streak':
          return this.compareValues(user.longestStreak, value, operator);

        case 'high_score_game':
          if (context?.score) {
            return this.compareValues(context.score, value, operator);
          }
          return false;

        case 'first_game':
          return user.gamesPlayed === 1;

        case 'perfect_score':
          return (
            context?.score &&
            context?.maxPossibleScore &&
            context.score === context.maxPossibleScore
          );

        case 'consecutive_wins':
          return await this.checkConsecutiveWins(user.id, value);

        case 'daily_streak':
          return await this.checkDailyStreak(user.id, value);

        case 'games_in_timeframe':
          return await this.checkGamesInTimeframe(
            user.id,
            value,
            badge.criteria.metadata?.timeframe || 'day',
          );

        case 'score_improvement':
          return await this.checkScoreImprovement(user.id, value);

        case 'social_referral':
          return user.referrals >= (value || 1);

        case 'level_reached':
          return context?.level && context.level >= value;

        case 'game_duration':
          return (
            context?.duration &&
            this.compareValues(context.duration, value, operator)
          );

        default:
          this.logger.warn(`Unknown achievement condition: ${condition}`);
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Error checking criteria for badge ${badge.name}: ${error.message}`,
      );
      return false;
    }
  }

  private compareValues(
    userValue: number,
    targetValue: number,
    operator: string,
  ): boolean {
    switch (operator) {
      case 'gte':
        return userValue >= targetValue;
      case 'lte':
        return userValue <= targetValue;
      case 'eq':
        return userValue === targetValue;
      case 'gt':
        return userValue > targetValue;
      case 'lt':
        return userValue < targetValue;
      default:
        return false;
    }
  }

  private async checkConsecutiveWins(
    userId: string,
    requiredWins: number,
  ): Promise<boolean> {
    const recentGames = await this.gameRepository.find({
      where: { userId, status: GameStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: requiredWins,
    });

    if (recentGames.length < requiredWins) return false;

    // Check if all recent games are wins (assuming win condition)
    return recentGames.every((game) => this.isGameWin(game));
  }

  private async checkDailyStreak(
    userId: string,
    requiredDays: number,
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(DISTINCT DATE(created_at)) as streak_days
      FROM games 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${requiredDays} days'
        AND status = 'completed'
    `;

    const result = await this.gameRepository.query(query, [userId]);
    return result[0]?.streak_days >= requiredDays;
  }

  private async checkGamesInTimeframe(
    userId: string,
    requiredGames: number,
    timeframe: string,
  ): Promise<boolean> {
    const intervals = {
      hour: '1 hour',
      day: '1 day',
      week: '7 days',
      month: '30 days',
    };

    const interval = intervals[timeframe] || '1 day';

    const query = `
      SELECT COUNT(*) as game_count
      FROM games 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${interval}'
        AND status = 'completed'
    `;

    const result = await this.gameRepository.query(query, [userId]);
    return result[0]?.game_count >= requiredGames;
  }

  private async checkScoreImprovement(
    userId: string,
    improvementPercentage: number,
  ): Promise<boolean> {
    const recentGames = await this.gameRepository.find({
      where: { userId, status: GameStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (recentGames.length < 2) return false;

    const latestScore = recentGames[0].score;
    const previousAverage =
      recentGames.slice(1, 6).reduce((sum, game) => sum + game.score, 0) /
      Math.min(5, recentGames.length - 1);

    const improvement =
      ((latestScore - previousAverage) / previousAverage) * 100;
    return improvement >= improvementPercentage;
  }

  private isGameWin(game: Game): boolean {
    // Define win condition based on your game logic
    // This is a simple example - adjust based on your requirements
    if (game.maxPossibleScore > 0) {
      return game.score >= game.maxPossibleScore * 0.7; // 70% of max score is a win
    }
    return game.score > 0; // Any positive score is a win
  }

  private async awardBadgeAutomatically(
    userId: string,
    badgeId: string,
    context?: any,
  ): Promise<UserBadge> {
    const userBadge = this.userBadgeRepository.create({
      userId,
      badgeId,
      isManuallyAwarded: false,
      metadata: context
        ? {
            gameId: context.gameId,
            score: context.score,
            duration: context.duration,
            context: 'auto_awarded',
            triggerEvent: context.triggerEvent || 'game_completion',
            additionalData: context.additionalData,
          }
        : {
            context: 'auto_awarded',
            triggerEvent: 'system_check',
          },
      isDisplayed: true,
    } as any);

    const saved = await this.userBadgeRepository.save(userBadge);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async initializeDefaultBadges(): Promise<void> {
    const defaultBadges = [
      // Gameplay Achievements
      {
        name: 'First Steps',
        description: 'Complete your first game',
        icon: '🎮',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: { condition: 'first_game' },
        points: 10,
        category: 'Getting Started',
      },
      {
        name: 'High Scorer',
        description: 'Achieve a score of 10,000 or more in a single game',
        icon: '🎯',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: {
          condition: 'high_score_game',
          value: 10000,
          operator: 'gte',
        },
        points: 50,
        category: 'Performance',
      },
      {
        name: 'Perfectionist',
        description: 'Achieve a perfect score',
        icon: '⭐',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: { condition: 'perfect_score' },
        points: 200,
        rarity: 'epic',
        category: 'Excellence',
      },
      {
        name: 'Speed Demon',
        description: 'Complete a game in under 60 seconds',
        icon: '⚡',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: { condition: 'game_duration', value: 60, operator: 'lte' },
        points: 75,
        rarity: 'rare',
        category: 'Speed',
      },

      // Milestone Achievements
      {
        name: 'Dedicated Player',
        description: 'Play 10 games',
        icon: '🏃',
        type: AchievementType.MILESTONE,
        isAutoAwarded: true,
        criteria: { condition: 'games_played', value: 10, operator: 'gte' },
        points: 25,
        category: 'Milestones',
      },
      {
        name: 'Century Club',
        description: 'Play 100 games',
        icon: '💯',
        type: AchievementType.MILESTONE,
        isAutoAwarded: true,
        criteria: { condition: 'games_played', value: 100, operator: 'gte' },
        points: 100,
        rarity: 'rare',
        category: 'Milestones',
      },
      {
        name: 'Score Master',
        description: 'Reach a total score of 100,000',
        icon: '🏆',
        type: AchievementType.MILESTONE,
        isAutoAwarded: true,
        criteria: { condition: 'total_score', value: 100000, operator: 'gte' },
        points: 150,
        rarity: 'epic',
        category: 'Milestones',
      },

      // Social Achievements
      {
        name: 'Social Butterfly',
        description: 'Refer 5 friends to the platform',
        icon: '🦋',
        type: AchievementType.SOCIAL,
        isAutoAwarded: true,
        criteria: { condition: 'referrals', value: 5, operator: 'gte' },
        points: 75,
        rarity: 'rare',
        category: 'Social',
      },
      {
        name: 'Influencer',
        description: 'Refer 25 friends to the platform',
        icon: '📢',
        type: AchievementType.SOCIAL,
        isAutoAwarded: true,
        criteria: { condition: 'referrals', value: 25, operator: 'gte' },
        points: 250,
        rarity: 'legendary',
        category: 'Social',
      },

      // Streak Achievements
      {
        name: 'On Fire',
        description: 'Win 5 games in a row',
        icon: '🔥',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: { condition: 'consecutive_wins', value: 5 },
        points: 100,
        rarity: 'rare',
        category: 'Streaks',
      },
      {
        name: 'Unstoppable',
        description: 'Win 10 games in a row',
        icon: '🚀',
        type: AchievementType.GAMEPLAY,
        isAutoAwarded: true,
        criteria: { condition: 'consecutive_wins', value: 10 },
        points: 300,
        rarity: 'legendary',
        category: 'Streaks',
      },

      // Special Achievements
      {
        name: 'Beta Tester',
        description: 'Special recognition for beta testing',
        icon: '🧪',
        type: AchievementType.SPECIAL,
        isAutoAwarded: false,
        points: 150,
        rarity: 'epic',
        category: 'Special',
      },
      {
        name: 'Community Champion',
        description: 'Outstanding contribution to the community',
        icon: '👑',
        type: AchievementType.SPECIAL,
        isAutoAwarded: false,
        points: 500,
        rarity: 'legendary',
        category: 'Special',
      },
    ];

    for (const badgeData of defaultBadges) {
      const existing = await this.badgeRepository.findOne({
        where: { name: badgeData.name },
      });

      if (!existing) {
        const badge = this.badgeRepository.create(badgeData as any);
        await this.badgeRepository.save(badge);
        this.logger.log(`Created default badge: ${badgeData.name}`);
      }
    }

    this.logger.log('Default badges initialization completed');
  }
}
