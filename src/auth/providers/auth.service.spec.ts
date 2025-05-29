import { Test, type TestingModule } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service"
import { UserService } from "../user/user.service"
import { Role } from "../common/enums/role.enum"

describe("AuthService", () => {
  let service: AuthService
  let userService: UserService
  let jwtService: JwtService

  const mockUserService = {
    validateUser: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
  }

  const mockJwtService = {
    sign: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userService = module.get<UserService>(UserService)
    jwtService = module.get<JwtService>(JwtService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("validateUser", () => {
    it("should return user data without password when credentials are valid", async () => {
      const email = "test@example.com"
      const password = "password123"
      const mockUser = {
        id: "123",
        email,
        username: "testuser",
        role: Role.PLAYER,
        password: "hashedPassword",
      }

      mockUserService.validateUser.mockResolvedValue(mockUser)

      const result = await service.validateUser(email, password)

      expect(result).toBeDefined()
      expect(result.password).toBeUndefined()
      expect(result.email).toBe(email)
    })

    it("should return null when credentials are invalid", async () => {
      const email = "test@example.com"
      const password = "wrongpassword"

      mockUserService.validateUser.mockResolvedValue(null)

      const result = await service.validateUser(email, password)

      expect(result).toBeNull()
    })
  })

  describe("login", () => {
    it("should return access token and user data", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        role: Role.PLAYER,
      }

      const mockToken = "jwt.token.here"
      mockJwtService.sign.mockReturnValue(mockToken)
      mockUserService.updateLastLogin.mockResolvedValue(undefined)

      const result = await service.login(mockUser)

      expect(result).toBeDefined()
      expect(result.access_token).toBe(mockToken)
      expect(result.user).toBeDefined()
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
    })
  })
})
