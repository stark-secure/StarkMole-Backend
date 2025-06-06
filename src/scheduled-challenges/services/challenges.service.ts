import { Injectable, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Challenge } from "../entities/challenge.entity"
import { type ChallengeAttempt, AttemptStatus } from "../entities/challenge-attempt.entity"
import type { DynamicDifficultyService } from "./dynamic-difficulty.service"
import type { CreateChallengeDto } from "../dto/create-challenge.dto"

@Injectable()
export class ChallengesService {
  constructor(
    private readonly challengeRepository: Repository<Challenge>,
    private readonly attemptRepository: Repository<ChallengeAttempt>,
    private readonly dynamicDifficultyService: DynamicDifficultyService,
  ) {}

  async create(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengeRepository.create(createChallengeDto)
    return this.challengeRepository.save(challenge)
  }

  async findAll(): Promise<Challenge[]> {
    return this.challengeRepository.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    })
  }

  async findOne(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { id, isActive: true },
    })

    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`)
    }

    return challenge
  }

  async startChallenge(challengeId: string, userId: string): Promise<ChallengeAttempt> {
    const challenge = await this.findOne(challengeId)

    const attempt = this.attemptRepository.create({
      challengeId: challenge.id,
      userId,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    })

    return this.attemptRepository.save(attempt)
  }

  async submitChallenge(attemptId: string, userId: string, userSolution: any): Promise<ChallengeAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, userId },
      relations: ["challenge"],
    })

    if (!attempt) {
      throw new NotFoundException(`Challenge attempt with ID ${attemptId} not found`)
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error("Challenge attempt is not in progress")
    }

    const now = new Date()
    const timeSpent = Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)

    // Simple scoring logic (can be enhanced)
    const score = this.calculateScore(attempt.challenge, userSolution, timeSpent)
    const status = score > 0 ? AttemptStatus.COMPLETED : AttemptStatus.FAILED

    attempt.userSolution = userSolution
    attempt.score = score
    attempt.timeSpent = timeSpent
    attempt.status = status
    attempt.completedAt = now

    const savedAttempt = await this.attemptRepository.save(attempt)

    // Update user difficulty profile
    await this.dynamicDifficultyService.updateUserDifficulty(userId, attempt.challenge.type, savedAttempt)

    return savedAttempt
  }

  private calculateScore(challenge: Challenge, userSolution: any, timeSpent: number): number {
    // Basic scoring logic - can be enhanced based on challenge type
    const baseScore = challenge.basePoints

    // Time bonus (faster completion gets higher score)
    const timeBonus = Math.max(0, ((challenge.timeLimit - timeSpent) / challenge.timeLimit) * 0.2)

    // Simple correctness check (this would need to be more sophisticated in real implementation)
    const isCorrect = this.checkSolution(challenge, userSolution)

    if (!isCorrect) {
      return 0
    }

    return Math.floor(baseScore * (1 + timeBonus))
  }

  private checkSolution(challenge: Challenge, userSolution: any): boolean {
    // Simplified solution checking - in reality, this would be much more complex
    // and would depend on the challenge type
    return true // Placeholder - always return true for now
  }

  async getUserAttempts(userId: string): Promise<ChallengeAttempt[]> {
    return this.attemptRepository.find({
      where: { userId },
      relations: ["challenge"],
      order: { createdAt: "DESC" },
    })
  }
}
