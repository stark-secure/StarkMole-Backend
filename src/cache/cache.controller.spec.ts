// import { Test, TestingModule } from '@nestjs/testing';
// import { CacheController } from './cache.controller';
// import { CacheService } from './cache.service';

// describe('CacheController', () => {
//   let controller: CacheController;
//   let cacheService: CacheService;

//   const mockCacheService = {
//     reset: jest.fn(),
//     del: jest.fn(),
//     get: jest.fn(),
//     getStats: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [CacheController],
//       providers: [
//         {
//           provide: CacheService,
//           useValue: mockCacheService,
//         },
//       ],
//     }).compile();

//     controller = module.get<CacheController>(CacheController);
//     cacheService = module.get<CacheService>(CacheService);

//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('clearAll', () => {
//     it('should clear all cache entries', async () => {
//       const result = await controller.clearAll();

//       expect(mockCacheService.reset).toHaveBeenCalled();
//       expect(result).toEqual({
//         message: 'Cache cleared successfully',
//         timestamp: expect.any(String),
//       });
//     });
//   });

//   describe('deleteByKey', () => {
//     it('should delete specific cache entry', async () => {
//       const key = 'test-cache-key';
      
//       const result = await controller.deleteByKey(key);

//       expect(mockCacheService.del).toHaveBeenCalledWith(key);
//       expect(result).toEqual({
//         message: 'Cache entry deleted successfully',
//         key,
//         timestamp: expect.any(String),
//       });
//     });
//   });

//   describe('getByKey', () => {
//     it('should return cache entry when found', async () => {
//       const key = 'test-key';
//       const value = { data: 'test-value' };
//       mockCacheService.get.mockResolvedValue(value);

//       const result = await controller.getByKey(key);

//       expect(mockCacheService.get).toHaveBeenCalledWith(key);
//       expect(result).toEqual({
//         key,
//         value,
//         timestamp: expect.any(String),
//       });
//     });

//     it('should return not found message when cache entry not found', async () => {
//       const key = 'nonexistent-key';
//       mockCacheService.get.mockResolvedValue(undefined);

//       const result = await controller.getByKey(key);

//       expect(mockCacheService.get).toHaveBeenCalledWith(key);
//       expect(result).toEqual({
//         message: 'Cache entry not found',
//         key,
//         timestamp: expect.any(String),
//       });
//     });
//   });

//   describe('clearByPattern', () => {
//     it('should clear all cache when pattern is *', async () => {
//       const pattern = '*';
      
//       const result = await controller.clearByPattern(pattern);

//       expect(mockCacheService.reset).toHaveBeenCalled();
//       expect(result).toEqual({
//         message: 'Cache entries cleared by pattern',
//         pattern,
//         timestamp: expect.any(String),
//       });
//     });

//     it('should clear all cache for any pattern (simplified implementation)', async () => {
//       const pattern = 'leaderboard:*';
      
//       const result = await controller.clearByPattern(pattern);

//       expect(mockCacheService.reset).toHaveBeenCalled();
//       expect(result).toEqual({
//         message: 'Cache entries cleared by pattern',
//         pattern,
//         timestamp: expect.any(String),
//       });
//     });
//   });

//   describe('warmUpCache', () => {
//     it('should return warm-up completed message', async () => {
//       const result = await controller.warmUpCache();

//       expect(result).toEqual({
//         message: 'Cache warm-up completed',
//         entriesWarmed: 0,
//         timestamp: expect.any(String),
//       });
//     });
//   });

//   describe('getCacheStats', () => {
//     it('should return cache statistics', async () => {
//       const mockStats = {
//         hits: 100,
//         misses: 25,
//         hitRate: 0.8,
//         totalRequests: 125,
//       };
//       mockCacheService.getStats.mockReturnValue(mockStats);

//       const result = await controller.getCacheStats();

//       expect(mockCacheService.getStats).toHaveBeenCalled();
//       expect(result).toEqual({
//         ...mockStats,
//         timestamp: expect.any(String),
//       });
//     });
//   });
// });
