
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaderboardService } from './Leaderboard.service';
import { Leaderboard } from './entities/leaderboard.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RealtimeGateway } from '../common/gateways/realtime.gateway';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  clear: jest.fn(),
};

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let gateway: RealtimeGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(Leaderboard),
          useValue: mockRepository,
        },
        {
          provide: RealtimeGateway,
          useValue: { emitLeaderboardUpdate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitScore', () => {
    it('should create new leaderboard entry for new user', async () => {
      const userId = 'test-user-id';
      const createDto = { score: 100 };
      const mockEntry = { id: 1, userId, score: 100, rank: 1 };

      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);
      mockRepository.find.mockResolvedValue([mockEntry]);
      mockRepository.findOne.mockResolvedValueOnce(mockEntry);

      const result = await service.submitScore(userId, createDto);
      expect(result).toEqual(mockEntry);
    });

    it('should throw BadRequestException for lower score', async () => {
      const userId = 'test-user-id';
      const createDto = { score: 50 };
      const existingEntry = { id: 1, userId, score: 100, rank: 1 };

      mockRepository.findOne.mockResolvedValue(existingEntry);

      await expect(service.submitScore(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserLeaderboard', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      const userId = 'non-existent-user';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserLeaderboard(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should emit leaderboard update', async () => {
    await service.updateLeaderboard('test', [{ user: 'a', score: 1 }]);
    expect(gateway.emitLeaderboardUpdate).toHaveBeenCalledWith('test', [{ user: 'a', score: 1 }]);
  });
});
