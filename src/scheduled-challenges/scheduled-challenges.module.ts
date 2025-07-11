import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { DailyChallengeService } from './services/daily-challenge.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyChallenge])],
  providers: [DailyChallengeService],
  exports: [DailyChallengeService],
})
export class ScheduledChallengesModule {}
