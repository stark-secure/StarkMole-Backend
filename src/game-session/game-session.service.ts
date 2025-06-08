import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GameSession } from './entities/game-session.entity';
import { InputEvent } from './entities/input-event.entity';
import { ReportSessionDto } from './dto/report-session.dto';
import * as crypto from 'crypto';

export interface SessionAnalytics {
  totalSessions: string;
  averageScore: number;
  highestScore: number;
  averageDuration: number;
}

@Injectable()
export class GameSessionService {
  private readonly logger = new Logger(GameSessionService.name);

  constructor(
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(InputEvent)
    private inputEventRepository: Repository<InputEvent>,
    private dataSource: DataSource,
  ) {}

  async reportSession(
    userId: string,
    reportSessionDto: ReportSessionDto,
  ): Promise<GameSession> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify session hash integrity
      const calculatedHash = this.calculateSessionHash(reportSessionDto);
      if (calculatedHash !== reportSessionDto.sessionHash) {
        throw new BadRequestException('Session integrity check failed');
      }

      // Create game session
      const gameSession = queryRunner.manager.create(GameSession, {
        userId,
        challengeId: reportSessionDto.challengeId,
        score: reportSessionDto.score,
        duration: reportSessionDto.duration,
        metadata: reportSessionDto.metadata,
        sessionHash: reportSessionDto.sessionHash,
        isVerified: true,
      });

      const savedSession = await queryRunner.manager.save(
        GameSession,
        gameSession,
      );

      // Create input events in batches for performance
      const batchSize = 1000;
      const inputBatches = this.chunkArray(reportSessionDto.inputs, batchSize);

      for (const batch of inputBatches) {
        const inputEvents = batch.map((input) =>
          queryRunner.manager.create(InputEvent, {
            gameSessionId: savedSession.id,
            eventType: input.eventType,
            timestamp: input.timestamp,
            eventData: input.eventData,
            clientId: input.clientId,
          }),
        );

        await queryRunner.manager.save(InputEvent, inputEvents);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Game session reported successfully for user ${userId}, session ${savedSession.id}`,
      );

      return savedSession;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to report session for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findSessionsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ sessions: GameSession[]; total: number }> {
    const [sessions, total] = await this.gameSessionRepository.findAndCount({
      where: { userId },
      relations: ['challenge', 'inputs'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { sessions, total };
  }

  async findSessionById(sessionId: string): Promise<GameSession> {
    const session = await this.gameSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'challenge', 'inputs'],
    });

    if (!session) {
      throw new NotFoundException('Game session not found');
    }

    return session;
  }

  async getSessionAnalytics(
    userId?: string,
    challengeId?: string,
  ): Promise<SessionAnalytics> {
    const queryBuilder = this.gameSessionRepository.createQueryBuilder('gs');

    if (userId) {
      queryBuilder.andWhere('gs.userId = :userId', { userId });
    }

    if (challengeId) {
      queryBuilder.andWhere('gs.challengeId = :challengeId', { challengeId });
    }

    const analytics = await queryBuilder
      .select([
        'COUNT(*) as totalSessions',
        'AVG(gs.score) as averageScore',
        'MAX(gs.score) as highestScore',
        'AVG(gs.duration) as averageDuration',
      ])
      .getRawOne<{
        totalSessions: string;
        averageScore: number;
        highestScore: number;
        averageDuration: number;
      }>();

    return analytics as SessionAnalytics;
  }

  private calculateSessionHash(sessionData: ReportSessionDto): string {
    const dataToHash = {
      challengeId: sessionData.challengeId,
      score: sessionData.score,
      duration: sessionData.duration,
      inputCount: sessionData.inputs.length,
      firstInput: sessionData.inputs[0]?.timestamp || 0,
      lastInput:
        sessionData.inputs[sessionData.inputs.length - 1]?.timestamp || 0,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
