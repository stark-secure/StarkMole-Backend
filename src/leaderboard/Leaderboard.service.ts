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

    // Check if user already has a leaderboard entry
    const leaderboardEntry = await this.leaderboardRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (leaderboardEntry) {
      // Only update if new score is higher
      if (score > leaderboardEntry.score) {
        leaderboardEntry.score = score;
        await this.leaderboardRepository.save(leaderboardEntry);

        // Recalculate ranks after score update
        await this.recalculateRanks();

        // Fetch updated entry with new rank
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

    // Create new leaderboard entry
    const newEntry = this.leaderboardRepository.create({
      userId,
      score,
      rank: 0, // Will be calculated after save
    });

    await this.leaderboardRepository.save(newEntry);

    // Recalculate ranks after new entry
    await this.recalculateRanks();

    // Fetch updated entry with new rank and user relation
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

  private async recalculateRanks(): Promise<void> {
    // Get all entries ordered by score descending
    const entries = await this.leaderboardRepository.find({
      order: { score: 'DESC', updatedAt: 'ASC' }, // In case of tie, earlier submission gets better rank
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
    }

    // Save all updated entries
    await this.leaderboardRepository.save(entries);
  }

  // Admin method to reset leaderboard
  async resetLeaderboard(): Promise<void> {
    await this.leaderboardRepository.clear();
  }
}
