import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { CacheService } from '../cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';
import { Request } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheMetadata = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
    
    if (!cacheMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(cacheMetadata.key, context);
    const ttl = cacheMetadata.ttl || this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || 300;

    // Try to get from cache
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return of(cachedResult);
    }

    // Cache miss - execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== undefined && data !== null) {
          await this.cacheService.set(cacheKey, data, ttl);
          this.logger.debug(`Cached result for key: ${cacheKey} with TTL: ${ttl}s`);
        }
      }),
    );
  }

  private buildCacheKey(template: string, context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const { params, query, user } = request;
    
    let key = template;
    
    // Replace URL parameters
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        key = key.replace(new RegExp(`{${param}}`, 'g'), String(value));
      }
    }
    
    // Replace query parameters
    if (query) {
      for (const [param, value] of Object.entries(query)) {
        key = key.replace(new RegExp(`{${param}}`, 'g'), String(value));
      }
    }
    
    // Replace user information
    if (user) {
      key = key.replace(/{userId}/g, user.id || user.userId || '');
      key = key.replace(/{userRole}/g, user.role || '');
    }

    // Add current date for time-sensitive keys
    key = key.replace(/{date}/g, new Date().toISOString().slice(0, 10));
    key = key.replace(/{timestamp}/g, Date.now().toString());

    return key;
  }
}
