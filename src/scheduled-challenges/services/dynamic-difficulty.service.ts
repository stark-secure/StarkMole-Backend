import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { UserDifficultyProfile } from "../entities/user-difficulty-profile.entity"
import { type ChallengeAttempt, AttemptStatus } from "../entities/challenge-attempt.entity"
import { type ChallengeType, DifficultyLevel } from "../entities/challenge.entity"

@Injectable()
export class DynamicDifficultyService {
  private readonly logger = new Logger(DynamicDifficultyService.name)

  constructor(
    private readonly difficultyProfileRepository: Repository<UserDifficultyProfile>,
    private readonly attemptRepository: Repository<ChallengeAttempt>,
  ) {}

  async updateUserDifficulty(userId: string, challengeType: ChallengeType, attempt: ChallengeAttempt): Promise<void> {
    let profile = await this.difficultyProfileRepository.findOne({
      where: { userId, challengeType },
    })

    if (!profile) {
      profile = this.difficultyProfileRepository.create({
        userId,
        challengeType,
        currentDifficulty: DifficultyLevel.BEGINNER,
        successRate: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageScore: 0,
        averageTimeSpent: 0,
      })
    }

    // Update statistics
    profile.totalAttempts += 1
    if (attempt.status === AttemptStatus.COMPLETED) {
      profile.successfulAttempts += 1
    }

    profile.successRate = profile.successfulAttempts / profile.totalAttempts
    profile.averageScore = (profile.averageScore * (profile.totalAttempts - 1) + attempt.score) / profile.totalAttempts
    profile.averageTimeSpent =
      (profile.averageTimeSpent * (profile.totalAttempts - 1) + attempt.timeSpent) / profile.totalAttempts
    profile.lastChallengeAt = new Date()

    // Adjust difficulty based on performance
    const newDifficulty = this.calculateNewDifficulty(profile)
    if (newDifficulty !== profile.currentDifficulty) {
      this.logger.log(
        `Adjusting difficulty for user ${userId} in ${challengeType}: ${profile.currentDifficulty} -> ${newDifficulty}`,
      )
      profile.currentDifficulty = newDifficulty
    }

    await this.difficultyProfileRepository.save(profile)
  }

  private calculateNewDifficulty(profile: UserDifficultyProfile): DifficultyLevel {
    const { successRate, totalAttempts, currentDifficulty, averageScore } = profile

    // Need at least 3 attempts to adjust difficulty
    if (totalAttempts < 3) {
      return currentDifficulty
    }

    // High performance indicators
    const highSuccessRate = successRate >= 0.8
    const highAverageScore = averageScore >= 80
    const shouldIncreasedifficulty = highSuccessRate && highAverageScore

    // Low performance indicators
    const lowSuccessRate = successRate <= 0.3
    const lowAverageScore = averageScore <= 40
    const shouldDecreasedifficulty = lowSuccessRate || lowAverageScore

    if (shouldIncreasedifficulty && currentDifficulty < DifficultyLevel.EXPERT) {
      return currentDifficulty + 1
    }

    if (shouldDecreasedifficulty && currentDifficulty > DifficultyLevel.BEGINNER) {
      return currentDifficulty - 1
    }

    return currentDifficulty
  }

  async getUserDifficulty(userId: string, challengeType: ChallengeType): Promise<DifficultyLevel> {
    const profile = await this.difficultyProfileRepository.findOne({
      where: { userId, challengeType },
    })

    return profile?.currentDifficulty || DifficultyLevel.BEGINNER
  }

  async getUserDifficultyProfile(userId: string, challengeType: ChallengeType): Promise<UserDifficultyProfile> {
    let profile = await this.difficultyProfileRepository.findOne({
      where: { userId, challengeType },
    })

    if (!profile) {
      profile = this.difficultyProfileRepository.create({
        userId,
        challengeType,
        currentDifficulty: DifficultyLevel.BEGINNER,
        successRate: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageScore: 0,
        averageTimeSpent: 0,
      })
      await this.difficultyProfileRepository.save(profile)
    }

    return profile
  }
}
