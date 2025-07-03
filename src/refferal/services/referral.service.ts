import { Injectable, BadRequestException, Logger } from "@nestjs/common"
import type { Repository, DataSource } from "typeorm"
import { User } from "../entities/user.entity"
import { Referral, ReferralStatus } from "../entities/referral.entity"
import { type Reward, RewardType, RewardStatus } from "../entities/reward.entity"
import type { ReferralStatsDto } from "../dto/auth.dto"

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name)

  constructor(
    private userRepository: Repository<User>,
    private referralRepository: Repository<Referral>,
    private rewardRepository: Repository<Reward>,
    private dataSource: DataSource,
  ) {}

  generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async generateUniqueReferralCode(): Promise<string> {
    let code: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateReferralCode()
      const existingUser = await this.userRepository.findOne({
        where: { referralCode: code },
      })

      if (!existingUser) {
        isUnique = true
        return code
      }
      attempts++
    }

    throw new Error("Unable to generate unique referral code")
  }

  async validateReferralCode(referralCode: string, newUserId: string): Promise<User | null> {
    if (!referralCode) return null

    const referrer = await this.userRepository.findOne({
      where: { referralCode },
    })

    if (!referrer) {
      throw new BadRequestException("Invalid referral code")
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      throw new BadRequestException("Cannot use your own referral code")
    }

    // Check if user was already referred by someone else
    const existingReferral = await this.referralRepository.findOne({
      where: { refereeId: newUserId },
    })

    if (existingReferral) {
      throw new BadRequestException("User has already been referred")
    }

    return referrer
  }

  async createReferralRelationship(referrer: User, referee: User): Promise<Referral> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Create referral record
      const referral = this.referralRepository.create({
        referralCode: referrer.referralCode,
        referrerId: referrer.id,
        refereeId: referee.id,
        status: ReferralStatus.PENDING,
      })

      const savedReferral = await queryRunner.manager.save(referral)

      // Update referee's referredBy field
      await queryRunner.manager.update(User, referee.id, {
        referredBy: referrer.id,
      })

      // Award registration bonus to referee
      await this.awardRegistrationBonus(referee, savedReferral, queryRunner.manager)

      await queryRunner.commitTransaction()
      this.logger.log(`Referral relationship created: ${referrer.id} -> ${referee.id}`)

      return savedReferral
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error("Failed to create referral relationship", error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  private async awardRegistrationBonus(referee: User, referral: Referral, manager: any): Promise<void> {
    const registrationReward = this.rewardRepository.create({
      userId: referee.id,
      referralId: referral.id,
      type: RewardType.REFEREE_BONUS,
      amount: 10.0, // $10 registration bonus
      description: "Welcome bonus for using referral code",
      status: RewardStatus.AWARDED,
      awardedAt: new Date(),
    })

    await manager.save(registrationReward)
    this.logger.log(`Registration bonus awarded to referee: ${referee.id}`)
  }

  async handleRegistrationComplete(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Update user registration status
      await queryRunner.manager.update(User, userId, {
        registrationCompleted: true,
      })

      // Find referral where this user is the referee
      const referral = await this.referralRepository.findOne({
        where: { refereeId: userId, registrationRewardGiven: false },
        relations: ["referrer"],
      })

      if (referral) {
        // Award referrer for successful registration
        const referrerReward = this.rewardRepository.create({
          userId: referral.referrerId,
          referralId: referral.id,
          type: RewardType.REFERRAL_REGISTRATION,
          amount: 5.0, // $5 for referrer
          description: "Reward for successful referral registration",
          status: RewardStatus.AWARDED,
          awardedAt: new Date(),
        })

        await queryRunner.manager.save(referrerReward)

        // Mark registration reward as given
        await queryRunner.manager.update(Referral, referral.id, {
          registrationRewardGiven: true,
        })

        this.logger.log(`Registration reward awarded to referrer: ${referral.referrerId}`)
      }

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error("Failed to handle registration complete", error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async handleFirstGameComplete(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Update user first game status
      await queryRunner.manager.update(User, userId, {
        firstGameCompleted: true,
      })

      // Find referral where this user is the referee
      const referral = await this.referralRepository.findOne({
        where: { refereeId: userId, milestoneRewardGiven: false },
        relations: ["referrer"],
      })

      if (referral) {
        // Award referrer for milestone completion
        const milestoneReward = this.rewardRepository.create({
          userId: referral.referrerId,
          referralId: referral.id,
          type: RewardType.REFERRAL_MILESTONE,
          amount: 15.0, // $15 for milestone
          description: "Reward for referee completing first game",
          status: RewardStatus.AWARDED,
          awardedAt: new Date(),
        })

        await queryRunner.manager.save(milestoneReward)

        // Mark milestone reward as given and referral as completed
        await queryRunner.manager.update(Referral, referral.id, {
          milestoneRewardGiven: true,
          status: ReferralStatus.COMPLETED,
        })

        this.logger.log(`Milestone reward awarded to referrer: ${referral.referrerId}`)
      }

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error("Failed to handle first game complete", error)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async getReferralStats(userId: string): Promise<ReferralStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    const [totalReferrals, completedReferrals, rewards] = await Promise.all([
      this.referralRepository.count({ where: { referrerId: userId } }),
      this.referralRepository.count({
        where: { referrerId: userId, status: ReferralStatus.COMPLETED },
      }),
      this.rewardRepository.find({ where: { userId } }),
    ])

    const totalRewards = rewards
      .filter((r) => r.status === RewardStatus.AWARDED || r.status === RewardStatus.CLAIMED)
      .reduce((sum, reward) => sum + Number(reward.amount), 0)

    const pendingRewards = rewards
      .filter((r) => r.status === RewardStatus.PENDING)
      .reduce((sum, reward) => sum + Number(reward.amount), 0)

    return {
      totalReferrals,
      completedReferrals,
      totalRewards,
      pendingRewards,
      referralCode: user.referralCode,
    }
  }

  async getUserRewards(userId: string): Promise<Reward[]> {
    return this.rewardRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    })
  }
}
