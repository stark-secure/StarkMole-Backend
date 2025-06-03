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

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
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

    if (leaderboardEntry) {
      if (score > leaderboardEntry.score) {
        leaderboardEntry.score = score;
        await this.leaderboardRepository.save(leaderboardEntry);

        if (process.env.LEADERBOARD_RECALCULATION_STRATEGY !== 'batch') {
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

    if (process.env.LEADERBOARD_RECALCULATION_STRATEGY !== 'batch') {
      await this.recalculateRanks();
    }

    const finalEntry = await this.leaderboardRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!finalEntry) {
      throw new NotFoundException('Leaderboard entry not found after creation');
    }

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
  }
}
