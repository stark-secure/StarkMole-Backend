import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private hits = 0;
  private misses = 0;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    if (value) {
      this.hits++;
      this.logger.debug(`Cache hit for key: ${key}`);
    } else {
      this.misses++;
      this.logger.debug(`Cache miss for key: ${key}`);
    }
    return value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, { ttl });
    this.logger.debug(`Cache set for key: ${key}, ttl: ${ttl}`);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
    this.logger.debug(`Cache reset`);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
    this.logger.debug(`Cache entry deleted for key: ${key}`);
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalRequests: total,
    };
  }

  resetStats() {
    this.hits = 0;
    this.misses = 0;
  }
}

