import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { CacheInterceptor } from './cache.interceptor';
import { CacheService } from '../cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let cacheService: CacheService;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    cacheService = module.get<CacheService>(CacheService);
    reflector = module.get<Reflector>(Reflector);

    // Mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          params: { userId: '123' },
          query: { page: '1', limit: '10' },
          user: { id: 'user123', role: 'player' },
        }),
      }),
      getHandler: jest.fn(),
    } as any;

    // Mock call handler
    mockCallHandler = {
      handle: jest.fn(),
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should skip caching when no cache metadata', async () => {
      mockReflector.get.mockReturnValue(undefined);
      const mockData = { result: 'test' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toEqual(mockCallHandler.handle());
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should skip caching for non-GET requests', async () => {
      mockReflector.get.mockReturnValue({ key: 'test-key', ttl: 300 });
      mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
        method: 'POST',
      });
      const mockData = { result: 'test' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(result).toEqual(mockCallHandler.handle());
      expect(mockCacheService.get).not.toHaveBeenCalled();
    });

    it('should return cached result when cache hit', async () => {
      const cacheKey = 'user:profile:user123';
      const cachedData = { cached: 'result' };
      
      mockReflector.get.mockReturnValue({ key: 'user:profile:{userId}', ttl: 300 });
      mockCacheService.get.mockResolvedValue(cachedData);

      const observable = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result = await observable.toPromise();

      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('user:profile:user123');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should execute handler and cache result on cache miss', async () => {
      const freshData = { fresh: 'result' };
      
      mockReflector.get.mockReturnValue({ key: 'user:profile:{userId}', ttl: 300 });
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of(freshData));

      const observable = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      // Subscribe to trigger the tap operator
      const result = await new Promise((resolve) => {
        observable.subscribe({
          next: (data) => resolve(data),
        });
      });

      expect(result).toEqual(freshData);
      expect(mockCacheService.get).toHaveBeenCalledWith('user:profile:user123');
      expect(mockCallHandler.handle).toHaveBeenCalled();
      
      // Give time for the async tap to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockCacheService.set).toHaveBeenCalledWith('user:profile:user123', freshData, 300);
    });

    it('should not cache null or undefined results', async () => {
      mockReflector.get.mockReturnValue({ key: 'test:key', ttl: 300 });
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of(null));

      const observable = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      await new Promise((resolve) => {
        observable.subscribe({
          next: resolve,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should build cache key with parameters and queries', async () => {
      const template = 'leaderboard:global:page:{page}:limit:{limit}:user:{userId}';
      mockReflector.get.mockReturnValue({ key: template, ttl: 300 });
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCacheService.get).toHaveBeenCalledWith('leaderboard:global:page:1:limit:10:user:user123');
    });

    it('should use TTL from metadata or reflector', async () => {
      const freshData = { test: 'data' };
      
      // Test with TTL from cache metadata
      mockReflector.get
        .mockReturnValueOnce({ key: 'test:key', ttl: 600 })
        .mockReturnValueOnce(undefined);
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of(freshData));

      const observable = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockCacheService.set).toHaveBeenCalledWith('test:key', freshData, 600);
    });

    it('should use default TTL when no TTL specified', async () => {
      const freshData = { test: 'data' };
      
      mockReflector.get
        .mockReturnValueOnce({ key: 'test:key' }) // No TTL in metadata
        .mockReturnValueOnce(undefined); // No TTL from reflector
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of(freshData));

      const observable = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      await new Promise((resolve) => {
        observable.subscribe({ next: resolve });
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockCacheService.set).toHaveBeenCalledWith('test:key', freshData, 300); // Default TTL
    });

    it('should handle date placeholders in cache key', async () => {
      const template = 'challenge:today:{date}';
      mockReflector.get.mockReturnValue({ key: template, ttl: 3600 });
      mockCacheService.get.mockResolvedValue(undefined);
      mockCallHandler.handle.mockReturnValue(of({ challenge: 'data' }));

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const today = new Date().toISOString().slice(0, 10);
      expect(mockCacheService.get).toHaveBeenCalledWith(`challenge:today:${today}`);
    });
  });
});
