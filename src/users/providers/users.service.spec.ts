import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { UserService } from "./users.service"
import { User } from "../entities/user.entity"
import { Role } from "src/common/enums/role.enum"

describe("UserService", () => {
  let service: UserService
  let repository: Repository<User>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    repository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const createUserDto = {
        email: "test@example.com",
        username: "testuser",
        password: "TestPass123!",
        role: Role.PLAYER,
      }

      const mockUser = {
        id: "123",
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.findOne.mockResolvedValue(null)
      mockRepository.create.mockReturnValue(mockUser)
      mockRepository.save.mockResolvedValue(mockUser)

      const result = await service.create(createUserDto)

      expect(result).toBeDefined()
      expect(result.email).toBe(createUserDto.email)
      expect(result.username).toBe(createUserDto.username)
    })

    it("should throw ConflictException when email already exists", async () => {
      const createUserDto = {
        email: "test@example.com",
        username: "testuser",
        password: "TestPass123!",
        role: Role.PLAYER,
      }

      mockRepository.findOne.mockResolvedValue({ email: "test@example.com" })

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("findOne", () => {
    it("should return a user when found", async () => {
      const userId = "123"
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        role: Role.PLAYER,
      }

      mockRepository.findOne.mockResolvedValue(mockUser)

      const result = await service.findOne(userId)

      expect(result).toBeDefined()
      expect(result.id).toBe(userId)
    })

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123"
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException)
    })
  })
})
