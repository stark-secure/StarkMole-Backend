import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"
import { Challenge } from "./entities/challenge.entity"
import { ChallengeAttempt } from "./entities/challenge-attempt.entity"
import { UserDifficultyProfile } from "./entities/user-difficulty-profile.entity"
import { ScheduledChallenge } from "./entities/scheduled-challenge.entity"
import { ChallengesService } from "./services/challenges.service"
import { DynamicDifficultyService } from "./services/dynamic-difficulty.service"
import { ChallengeGenerationService } from "./services/challenge-generation.service"
import { ScheduledChallengeService } from "./services/scheduled-challenge.service"
import { ChallengesController } from "./challenges.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeAttempt, UserDifficultyProfile, ScheduledChallenge]),
    ScheduleModule.forRoot(),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, DynamicDifficultyService, ChallengeGenerationService, ScheduledChallengeService],
  exports: [ChallengesService, DynamicDifficultyService, ChallengeGenerationService, ScheduledChallengeService],
})
export class ChallengesModule {}
