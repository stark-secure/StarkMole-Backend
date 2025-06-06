import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { type Repository, LessThan } from "typeorm"
import { Cron, CronExpression } from "@nestjs/schedule"
import { ScheduledChallenge, ScheduleStatus } from "../entities/scheduled-challenge.entity"
import type { ChallengeGenerationService } from "./challenge-generation.service"
import { ChallengeType, DifficultyLevel } from "../entities/challenge.entity"
import type { ScheduleChallengeDto } from "../dto/schedule-challenge.dto"

@Injectable()
export class ScheduledChallengeService {
  private readonly logger = new Logger(ScheduledChallengeService.name);

  constructor(
    private readonly challengeGenerationService: ChallengeGenerationService,
    @InjectRepository(ScheduledChallenge)
    private readonly scheduledChallengeRepository: Repository<ScheduledChallenge>,
  ) {}

  // Run every hour to check for scheduled challenges
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledChallenges(): Promise<void> {
    this.logger.log("Processing scheduled challenges...")

    const now = new Date()
    const pendingChallenges = await this.scheduledChallengeRepository.find({
      where: {
        status: ScheduleStatus.PENDING,
        scheduledFor: LessThan(now),
      },
      relations: ["challenge"],
    })

    for (const scheduledChallenge of pendingChallenges) {
      try {
        scheduledChallenge.status = ScheduleStatus.ACTIVE
        await this.scheduledChallengeRepository.save(scheduledChallenge)

        this.logger.log(`Activated scheduled challenge: ${scheduledChallenge.id}`)
      } catch (error) {
        this.logger.error(`Failed to activate scheduled challenge ${scheduledChallenge.id}:`, error)
      }
    }

    // Mark expired challenges
    const expiredChallenges = await this.scheduledChallengeRepository.find({
      where: {
        status: ScheduleStatus.ACTIVE,
        expiresAt: LessThan(now),
      },
    })

    for (const expiredChallenge of expiredChallenges) {
      expiredChallenge.status = ScheduleStatus.EXPIRED
      await this.scheduledChallengeRepository.save(expiredChallenge)
      this.logger.log(`Expired scheduled challenge: ${expiredChallenge.id}`)
    }
  }

  // Generate daily challenges for all users
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyChallenges(): Promise<void> {
    this.logger.log("Generating daily challenges...")

    const challengeTypes = Object.values(ChallengeType)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // Schedule for 9 AM tomorrow

    const expiresAt = new Date(tomorrow)
    expiresAt.setHours(23, 59, 59, 999) // Expires at end of day

    for (const type of challengeTypes) {
      try {
        // Generate a medium difficulty global challenge for each type
        const challenge = await this.challengeGenerationService.generateGlobalChallenge(type, DifficultyLevel.MEDIUM)

        const scheduledChallenge = this.scheduledChallengeRepository.create({
          challengeId: challenge.id,
          userId: null, // Global challenge
          status: ScheduleStatus.PENDING,
          scheduledFor: tomorrow,
          expiresAt,
          isGlobal: true,
          metadata: {
            type: "daily_challenge",
            generatedAt: new Date(),
          },
        })

        await this.scheduledChallengeRepository.save(scheduledChallenge)
        this.logger.log(`Scheduled daily ${type} challenge for tomorrow`)
      } catch (error) {
        this.logger.error(`Failed to generate daily ${type} challenge:`, error)
      }
    }
  }

  // Generate weekly challenges with higher difficulty
  @Cron(CronExpression.EVERY_SUNDAY_AT_MIDNIGHT)
  async generateWeeklyChallenges(): Promise<void> {
    this.logger.log("Generating weekly challenges...")

    const nextSunday = new Date()
    nextSunday.setDate(nextSunday.getDate() + 7)
    nextSunday.setHours(10, 0, 0, 0)

    const expiresAt = new Date(nextSunday)
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires next Sunday

    const challengeTypes = [ChallengeType.CODING, ChallengeType.ALGORITHM]

    for (const type of challengeTypes) {
      try {
        const challenge = await this.challengeGenerationService.generateGlobalChallenge(type, DifficultyLevel.HARD)

        const scheduledChallenge = this.scheduledChallengeRepository.create({
          challengeId: challenge.id,
          userId: null,
          status: ScheduleStatus.PENDING,
          scheduledFor: nextSunday,
          expiresAt,
          isGlobal: true,
          metadata: {
            type: "weekly_challenge",
            generatedAt: new Date(),
          },
        })

        await this.scheduledChallengeRepository.save(scheduledChallenge)
        this.logger.log(`Scheduled weekly ${type} challenge`)
      } catch (error) {
        this.logger.error(`Failed to generate weekly ${type} challenge:`, error)
      }
    }
  }

  async scheduleChallenge(scheduleChallengeDto: ScheduleChallengeDto): Promise<ScheduledChallenge> {
    const scheduledChallenge = this.scheduledChallengeRepository.create({
      ...scheduleChallengeDto,
      scheduledFor: new Date(scheduleChallengeDto.scheduledFor),
      expiresAt: scheduleChallengeDto.expiresAt ? new Date(scheduleChallengeDto.expiresAt) : null,
    })

    return this.scheduledChallengeRepository.save(scheduledChallenge)
  }

  async getActiveScheduledChallenges(userId?: string): Promise<ScheduledChallenge[]> {
    const where: any = { status: ScheduleStatus.ACTIVE }

    if (userId) {
      where.userId = userId
    } else {
      where.isGlobal = true
    }

    return this.scheduledChallengeRepository.find({
      where,
      relations: ["challenge"],
      order: { scheduledFor: "DESC" },
    })
  }

  async getUserScheduledChallenges(userId: string): Promise<ScheduledChallenge[]> {
    return this.scheduledChallengeRepository.find({
      where: [
        { userId, status: ScheduleStatus.ACTIVE },
        { isGlobal: true, status: ScheduleStatus.ACTIVE },
      ],
      relations: ["challenge"],
      order: { scheduledFor: "DESC" },
    })
  }
}
