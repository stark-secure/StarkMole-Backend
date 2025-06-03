import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, ChallengeDifficulty } from './entities/challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengeRepository.create(createChallengeDto);
    return this.challengeRepository.save(challenge);
  }

  async findTodayChallenge(): Promise<ChallengeResponseDto> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const key = `challenge:${today.toISOString().slice(0, 10)}`;
    let challenge = await this.cacheManager.get<Challenge>(key);
    if (!challenge) {
      challenge = await this.challengeRepository.findOne({ where: { date: today } });
      if (challenge) {
        await this.cacheManager.set(key, challenge, 86400);
      } else {
        challenge = await this.generateAndSaveTodayChallenge();
      }
    }
    return plainToInstance(ChallengeResponseDto, challenge, { excludeExtraneousValues: true });
  }

  async generateAndSaveTodayChallenge(): Promise<Challenge> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    // Simple mock pattern and random difficulty
    const pattern = JSON.stringify({ moles: Array.from({ length: 9 }, () => Math.round(Math.random())) });
    const difficulties = Object.values(ChallengeDifficulty);
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const challenge = this.challengeRepository.create({
      pattern,
      difficulty,
      date: today,
    });
    const saved = await this.challengeRepository.save(challenge);
    const key = `challenge:${today.toISOString().slice(0, 10)}`;
    await this.cacheManager.set(key, saved, 86400);
    this.logger.log(`Generated and cached new challenge for ${today.toISOString().slice(0, 10)}`);
    return saved;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyChallengeGeneration() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const exists = await this.challengeRepository.findOne({ where: { date: today } });
    if (!exists) {
      await this.generateAndSaveTodayChallenge();
    }
  }
}
