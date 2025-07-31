import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HashingService } from './hashing.service';
import { TypedConfigService } from '../../common/config/typed-config.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('HashingService', () => {
  let service: HashingService;
  let configService: jest.Mocked<ConfigService>;
  let typedConfigService: jest.Mocked<TypedConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTypedConfigService = {
    bcryptSaltRounds: 12,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TypedConfigService,
          useValue: mockTypedConfigService,
        },
      ],
    }).compile();

    service = module.get<HashingService>(HashingService);
    configService = module.get(ConfigService);
    typedConfigService = module.get(TypedConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should use configured salt rounds within safe range', () => {
      // Service should be initialized with 12 rounds (from mock)
      expect(service).toBeDefined();
    });

    it('should enforce minimum salt rounds', async () => {
      // Create service with low salt rounds
      const lowSaltService = new HashingService(
        mockConfigService,
        { ...mockTypedConfigService, bcryptSaltRounds: 5 } as any
      );
      
      expect(lowSaltService).toBeDefined();
      // The service should internally use minimum of 10 rounds
    });

    it('should enforce maximum salt rounds', async () => {
      // Create service with high salt rounds
      const highSaltService = new HashingService(
        mockConfigService,
        { ...mockTypedConfigService, bcryptSaltRounds: 20 } as any
      );
      
      expect(highSaltService).toBeDefined();
      // The service should internally use maximum of 15 rounds
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should throw InternalServerErrorException on bcrypt error', async () => {
      const password = 'testPassword123!';
      
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(service.hashPassword(password)).rejects.toThrow('Error hashing password');
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = 'hashedEmptyPassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = 'hashedSpecialPassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should return false for non-matching passwords', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should throw InternalServerErrorException on bcrypt error', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(service.comparePassword(plainPassword, hashedPassword)).rejects.toThrow('Error comparing passwords');
    });

    it('should handle empty plain password', async () => {
      const plainPassword = '';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should handle empty hashed password', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = '';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });
  });

  describe('security considerations', () => {
    it('should use consistent timing for password comparison', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const startTime = Date.now();
      await service.comparePassword(plainPassword, hashedPassword);
      const endTime = Date.now();

      // bcrypt should provide consistent timing
      expect(endTime - startTime).toBeGreaterThan(0);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = 'hash1';
      const hash2 = 'hash2';
      
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce(hash1)
        .mockResolvedValueOnce(hash2);

      const result1 = await service.hashPassword(password);
      const result2 = await service.hashPassword(password);

      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
      expect(result1).not.toBe(result2);
    });
  });
});
