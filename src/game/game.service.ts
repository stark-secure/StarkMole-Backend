import { Injectable, Logger } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { type Game, GameStatus } from './entities/game.entity';
import { AchievementService } from '../badge/services/achievement.service';
import { UserService } from '../users/providers/users.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private gameRepository: Repository<Game>,
    private achievementService: AchievementService,
    private userService: UserService,
  ) {}

  async createGame(
    userId: string,
    score: number,
    gameData?: any,
  ): Promise<{ game: Game; newBadges: any[] }> {
    const game = this.gameRepository.create({
      userId,
      score,
      maxPossibleScore: gameData?.maxPossibleScore || 0,
      status: GameStatus.COMPLETED,
      duration: gameData?.duration || 0,
      level: gameData?.level || 1,
      gameData,
    });

    const savedGame = await this.gameRepository.save(game);

    // Update user statistics
    await this.userService.updateUserStats(userId, {
      score,
      maxPossibleScore: gameData?.maxPossibleScore,
      ...gameData,
    });

    // Check for achievements
    const newBadges = await this.achievementService.checkAndAwardAchievements(
      userId,
      {
        gameId: savedGame.id,
        score,
        maxPossibleScore: gameData?.maxPossibleScore,
        level: gameData?.level,
        duration: gameData?.duration,
        triggerEvent: 'game_completion',
        additionalData: gameData,
      },
    );

    this.logger.log(
      `Game completed for user ${userId}. Score: ${score}. New badges: ${newBadges.length}`,
    );

    return { game: savedGame, newBadges };
  }

  async getUserGames(userId: string, limit = 10): Promise<Game[]> {
    return await this.gameRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getGameStats(userId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_games,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        SUM(CASE WHEN score > 0 THEN 1 ELSE 0 END) as games_won,
        AVG(duration) as average_duration
      FROM games 
      WHERE user_id = $1 AND status = 'completed'
    `;

    const result = await this.gameRepository.query(query, [userId]);
    return result[0];
  }
}
