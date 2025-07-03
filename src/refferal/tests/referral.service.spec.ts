import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { type Repository, DataSource } from "typeorm"
import { BadRequestException } from "@nestjs/common"
import { ReferralService } from "../services/referral.service"
import { User } from "../entities/user.entity"
import { Referral, ReferralStatus } from "../entities/referral.entity"
import { Reward, RewardType, RewardStatus } from "../entities/reward.entity"
import { jest } from "@jest/globals" // Import jest to declare it

describe("ReferralService", () => {
  let service: ReferralService
  let userRepository: Repository<User>
  let referralRepository: Repository<Referral>
  let rewardRepository: Repository<Reward>
  let dataSource: DataSource

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Referral),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => mockQueryRunner),
          },
        },
      ],
    }).compile()

    service = module.get<ReferralService>(ReferralService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    referralRepository = module.get<Repository<Referral>>(getRepositoryToken(Referral))
    rewardRepository = module.get<Repository<Reward>>(getRepositoryToken(Reward))
    dataSource = module.get<DataSource>(DataSource)
  })

  describe("generateReferralCode", () => {
    it("should generate a referral code of correct length", () => {
      const code = service.generateReferralCode()
      expect(code).toHaveLength(8)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })
  })

  describe("generateUniqueReferralCode", () => {
    it("should generate a unique referral code", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(null)

      const code = await service.generateUniqueReferralCode()
      expect(code).toHaveLength(8)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { referralCode: code },
      })
    })

    it("should retry if code already exists", async () => {
      const existingUser = { id: "1", referralCode: "EXISTING1" } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValueOnce(existingUser).mockResolvedValueOnce(null)

      const code = await service.generateUniqueReferralCode()
      expect(code).toHaveLength(8)
      expect(userRepository.findOne).toHaveBeenCalledTimes(2)
    })
  })

  describe("validateReferralCode", () => {
    it("should return null for empty referral code", async () => {
      const result = await service.validateReferralCode("", "user-id")
      expect(result).toBeNull()
    })

    it("should throw error for invalid referral code", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(null)

      await expect(service.validateReferralCode("INVALID", "user-id")).rejects.toThrow(BadRequestException)
    })

    it("should throw error for self-referral", async () => {
      const user = { id: "user-id", referralCode: "VALID123" } as User
      jest.spyOn(userRepository, "findOne").mockResolvedValue(user)

      await expect(service.validateReferralCode("VALID123", "user-id")).rejects.toThrow(
        "Cannot use your own referral code",
      )
    })

    it("should throw error if user already referred", async () => {
      const referrer = { id: "referrer-id", referralCode: "VALID123" } as User
      const existingReferral = { id: "referral-id" } as Referral

      jest.spyOn(userRepository, "findOne").mockResolvedValue(referrer)
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(existingReferral)

      await expect(service.validateReferralCode("VALID123", "user-id")).rejects.toThrow(
        "User has already been referred",
      )
    })

    it("should return referrer for valid code", async () => {
      const referrer = { id: "referrer-id", referralCode: "VALID123" } as User

      jest.spyOn(userRepository, "findOne").mockResolvedValue(referrer)
      jest.spyOn(referralRepository, "findOne").mockResolvedValue(null)

      const result = await service.validateReferralCode("VALID123", "user-id")
      expect(result).toEqual(referrer)
    })
  })

  describe("getReferralStats", () => {
    it("should return correct referral statistics", async () => {
      const user = { id: "user-id", referralCode: "USER123" } as User
      const rewards = [
        { amount: 10, status: RewardStatus.AWARDED },
        { amount: 5, status: RewardStatus.PENDING },
        { amount: 15, status: RewardStatus.CLAIMED },
      ] as Reward[]

      jest.spyOn(userRepository, "findOne").mockResolvedValue(user)
      jest
        .spyOn(referralRepository, "count")
        .mockResolvedValueOnce(5) // total referrals
        .mockResolvedValueOnce(3) // completed referrals
      jest.spyOn(rewardRepository, "find").mockResolvedValue(rewards)

      const stats = await service.getReferralStats("user-id")

      expect(stats).toEqual({
        totalReferrals: 5,
        completedReferrals: 3,
        totalRewards: 25, // 10 + 15
        pendingRewards: 5,
        referralCode: "USER123",
      })
    })

    it("should throw error for non-existent user", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(null)

      await expect(service.getReferralStats("invalid-id")).rejects.toThrow(BadRequestException)
    })
  })

  describe("handleRegistrationComplete", () => {
    it("should award referrer when referee completes registration", async () => {
      const referral = {
        id: "referral-id",
        referrerId: "referrer-id",
        registrationRewardGiven: false,
      } as Referral

      jest.spyOn(referralRepository, "findOne").mockResolvedValue(referral)
      jest.spyOn(rewardRepository, "create").mockReturnValue({} as Reward)

      await service.handleRegistrationComplete("referee-id")

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(User, "referee-id", { registrationCompleted: true })
      expect(rewardRepository.create).toHaveBeenCalledWith({
        userId: "referrer-id",
        referralId: "referral-id",
        type: RewardType.REFERRAL_REGISTRATION,
        amount: 5.0,
        description: "Reward for successful referral registration",
        status: RewardStatus.AWARDED,
        awardedAt: expect.any(Date),
      })
    })
  })

  describe("handleFirstGameComplete", () => {
    it("should award referrer and complete referral when referee completes first game", async () => {
      const referral = {
        id: "referral-id",
        referrerId: "referrer-id",
        milestoneRewardGiven: false,
      } as Referral

      jest.spyOn(referralRepository, "findOne").mockResolvedValue(referral)
      jest.spyOn(rewardRepository, "create").mockReturnValue({} as Reward)

      await service.handleFirstGameComplete("referee-id")

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(User, "referee-id", { firstGameCompleted: true })
      expect(rewardRepository.create).toHaveBeenCalledWith({
        userId: "referrer-id",
        referralId: "referral-id",
        type: RewardType.REFERRAL_MILESTONE,
        amount: 15.0,
        description: "Reward for referee completing first game",
        status: RewardStatus.AWARDED,
        awardedAt: expect.any(Date),
      })
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Referral, "referral-id", {
        milestoneRewardGiven: true,
        status: ReferralStatus.COMPLETED,
      })
    })
  })
})
