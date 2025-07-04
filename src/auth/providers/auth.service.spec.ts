import { Test, type TestingModule } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service"
import { UserService } from 'src/users/providers/users.service';
import { Role } from 'src/common/enums/role.enum';
import { MailService } from 'src/mail/mail.service';
import { HashingService } from './hashing.service';

describe("AuthService", () => {
  let service: AuthService
  let userService: UserService
  let jwtService: JwtService

  const mockUserService = {
    validateUser: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
    findByVerificationToken: jest.fn(),
    update: jest.fn(),
  }

  const mockJwtService = {
    sign: jest.fn(),
  }

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockHashingService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

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
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: HashingService,
          useValue: mockHashingService,
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

  describe('register', () => {
    it('should send verification email and not log in user immediately', async () => {
      const registerDto = { email: 'test@example.com', username: 'testuser', password: 'TestPass123!' };
      const user = { ...registerDto, id: '123', isEmailVerified: false };
      mockUserService.create.mockResolvedValue(user);
      mockUserService.findByEmail.mockResolvedValue(user);
      mockMailService.sendVerificationEmail.mockResolvedValue(undefined);
      const result = await service.register(registerDto);
      expect(result.user).toBeDefined();
      expect(result.access_token).toBe('');
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should throw if user is not verified', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = { id: '123', email, password: 'hashed', isEmailVerified: false };
      mockUserService.findByEmail.mockResolvedValue(user);
      await expect(service.validateUser(email, password)).rejects.toThrow('Please verify your email to log in');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user if token is valid and not expired', async () => {
      const token = 'valid-token';
      const user = { id: '123', email: 'test@example.com', isEmailVerified: false, emailVerificationExpires: new Date(Date.now() + 10000) };
      mockUserService.findByVerificationToken = jest.fn().mockResolvedValue(user);
      mockUserService.update = jest.fn().mockResolvedValue({ ...user, isEmailVerified: true });
      const result = await service.verifyEmail(token);
      expect(result).toBe(true);
      expect(mockUserService.update).toHaveBeenCalledWith(user.id, expect.objectContaining({ isEmailVerified: true }));
    });
    it('should throw if token is invalid', async () => {
      mockUserService.findByVerificationToken = jest.fn().mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow('Invalid or expired verification token');
    });
    it('should throw if already verified', async () => {
      const user = { id: '123', isEmailVerified: true };
      mockUserService.findByVerificationToken = jest.fn().mockResolvedValue(user);
      await expect(service.verifyEmail('token')).rejects.toThrow('Email already verified');
    });
    it('should throw if token expired', async () => {
      const user = { id: '123', isEmailVerified: false, emailVerificationExpires: new Date(Date.now() - 10000) };
      mockUserService.findByVerificationToken = jest.fn().mockResolvedValue(user);
      await expect(service.verifyEmail('token')).rejects.toThrow('Verification token expired');
    });
  });

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
        isEmailVerified: true,
      }

      mockUserService.validateUser.mockResolvedValue(mockUser)
      mockUserService.findByEmail.mockResolvedValue(mockUser)
      mockHashingService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password)

      expect(result).toBeDefined()
      expect(result.email).toBe(email)
    })

    it("should return null when credentials are invalid", async () => {
      const email = "test@example.com"
      const password = "wrongpassword"

      mockUserService.validateUser.mockResolvedValue(null)
      mockUserService.findByEmail.mockResolvedValue({
        id: "123",
        email,
        username: "testuser",
        role: Role.PLAYER,
        password: "hashedPassword",
        isEmailVerified: true,
      })
      mockHashingService.comparePassword.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow('Unauthorized')
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

  describe('resendVerificationEmail', () => {
    it('should send verification email if user is not verified', async () => {
      const email = 'test@example.com';
      const user = { id: '123', email, username: 'testuser', isEmailVerified: false };
      mockUserService.findByEmail.mockResolvedValue(user);
      mockUserService.update.mockResolvedValue(user);
      mockMailService.sendVerificationEmail.mockResolvedValue(undefined);
      const result = await service.resendVerificationEmail(email);
      expect(result).toBe(true);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
    it('should throw if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      await expect(service.resendVerificationEmail('notfound@example.com')).rejects.toThrow('User not found');
    });
    it('should throw if already verified', async () => {
      const user = { id: '123', email: 'test@example.com', isEmailVerified: true };
      mockUserService.findByEmail.mockResolvedValue(user);
      await expect(service.resendVerificationEmail(user.email)).rejects.toThrow('Email already verified');
    });
  });
})
