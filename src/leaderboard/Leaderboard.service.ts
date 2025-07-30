/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { Cron } from '@nestjs/schedule';
import { TypedConfigService } from '../common/config/typed-config.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../common/gateways/realtime.gateway';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
    private readonly configService: TypedConfigService,
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async submitScore(
    userId: string,
    createLeaderboardDto: CreateLeaderboardDto,
  ): Promise<Leaderboard> {
    const { score } = createLeaderboardDto;

    const leaderboardEntry = await this.leaderboardRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    let previousRank: number | undefined = leaderboardEntry?.rank;

    if (leaderboardEntry) {
      if (score > leaderboardEntry.score) {
        leaderboardEntry.score = score;
        await this.leaderboardRepository.save(leaderboardEntry);

        if (this.configService.leaderboardRecalculationStrategy !== 'batch') {
          await this.recalculateRanks();
        }

        const updatedEntry = await this.leaderboardRepository.findOne({
          where: { userId },
          relations: ['user'],
        });

        if (!updatedEntry) {
          throw new NotFoundException(
            'Leaderboard entry not found after update',
          );
        }

        // Notify if rank changed
        if (previousRank !== undefined && updatedEntry.rank !== previousRank) {
          await this.notificationService.create({
            userIds: [userId],
            title: 'Leaderboard Update',
            message: `Your new leaderboard rank is ${updatedEntry.rank}.`,
            type: 'leaderboard',
            icon: '🏆',
          });
          
          // Emit rank change event
          this.realtimeGateway.emitUserRankChange(userId, previousRank, updatedEntry.rank, updatedEntry.score);
        }

        // Emit real-time leaderboard update
        await this.emitRealtimeLeaderboardUpdate('global', updatedEntry.rank !== previousRank ? 'rank_change' : 'score_change');

        return updatedEntry;
      } else {
        throw new BadRequestException(
          'New score must be higher than current score',
        );
      }
    }

    const newEntry = this.leaderboardRepository.create({
      userId,
      score,
      rank: 0,
    });

    await this.leaderboardRepository.save(newEntry);

    if (this.configService.leaderboardRecalculationStrategy !== 'batch') {
      await this.recalculateRanks();
    }

    const finalEntry = await this.leaderboardRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!finalEntry) {
      throw new NotFoundException('Leaderboard entry not found after creation');
    }

    // Notify for new leaderboard entry
    await this.notificationService.create({
      userIds: [userId],
      title: 'Leaderboard Entry',
      message: `You have entered the leaderboard at rank ${finalEntry.rank}.`,
      type: 'leaderboard',
      icon: '🏆',
    });

    // Emit real-time leaderboard update for new entry
    await this.emitRealtimeLeaderboardUpdate('global', 'new_entry');

    return finalEntry;
  }

  async getGlobalLeaderboard(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    leaderboard: Leaderboard[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [leaderboard, total] = await this.leaderboardRepository.findAndCount({
      relations: ['user'],
      order: { rank: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      leaderboard,
      total,
      page,
      limit,
    };
  }

  async getUserLeaderboard(userId: string): Promise<Leaderboard> {
    const leaderboardEntry = await this.leaderboardRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!leaderboardEntry) {
      throw new NotFoundException('User not found in leaderboard');
    }

    return leaderboardEntry;
  }

  async updateScore(
    userId: string,
    updateLeaderboardDto: UpdateLeaderboardDto,
  ): Promise<Leaderboard> {
    return this.submitScore(
      userId,
      updateLeaderboardDto as CreateLeaderboardDto,
    );
  }

  // Batched rank recalculation every 5 minutes
  @Cron('*/5 * * * *')
  public async recalculateRanks(): Promise<void> {
    const entries = await this.leaderboardRepository.find({
      order: { score: 'DESC', updatedAt: 'ASC' },
    });

    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
    }

    await this.leaderboardRepository.save(entries);
  }

  // Optional: manual trigger
  async forceRecalculateRanks(): Promise<void> {
    await this.recalculateRanks();
  }

  async resetLeaderboard(): Promise<void> {
    await this.leaderboardRepository.clear();
    await this.emitRealtimeLeaderboardUpdate('global', 'reset');
  }

  private async emitRealtimeLeaderboardUpdate(leaderboardId: string, updateType: 'score_change' | 'rank_change' | 'new_entry' | 'reset'): Promise<void> {
    const top100 = await this.getGlobalLeaderboard(1, 100);
    this.realtimeGateway.emitLeaderboardUpdate(leaderboardId, top100.leaderboard, updateType);

    if (updateType === 'reset') {
      this.realtimeGateway.emitLeaderboardStats(leaderboardId, {
        totalPlayers: 0,
        averageScore: 0,
        topScore: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}
