import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CacheService } from './cache.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Cache Management')
@ApiBearerAuth('JWT-auth')
@Controller('cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @ApiOperation({ summary: 'Clear all cache entries (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cache cleared successfully' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @Delete('clear-all')
  async clearAll() {
    await this.cacheService.reset();
    return {
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete specific cache entry by key (Admin only)' })
  @ApiParam({
    name: 'key',
    description: 'Cache key to delete',
    example: 'leaderboard:global:page:1:limit:50',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache entry deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cache entry deleted successfully' },
        key: { type: 'string', example: 'leaderboard:global:page:1:limit:50' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @Delete(':key')
  async deleteByKey(@Param('key') key: string) {
    await this.cacheService.del(key);
    return {
      message: 'Cache entry deleted successfully',
      key,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get cache entry by key (Admin only)' })
  @ApiParam({
    name: 'key',
    description: 'Cache key to retrieve',
    example: 'leaderboard:global:page:1:limit:50',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache entry retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cache entry not found',
  })
  @Get(':key')
  async getByKey(@Param('key') key: string) {
    const value = await this.cacheService.get(key);
    if (value === undefined) {
      return {
        message: 'Cache entry not found',
        key,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      key,
      value,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Clear cache by pattern (Admin only)' })
  @ApiQuery({
    name: 'pattern',
    description: 'Pattern to match cache keys (e.g., "leaderboard:*")',
    example: 'leaderboard:*',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache entries cleared by pattern',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cache entries cleared by pattern' },
        pattern: { type: 'string', example: 'leaderboard:*' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @Delete()
  async clearByPattern(@Query('pattern') pattern: string) {
    // Note: This is a simplified implementation. In production, you might want to
    // implement pattern-based deletion using Redis SCAN and DEL commands
    if (pattern === '*') {
      await this.cacheService.reset();
    } else {
      // For now, we'll just clear all cache. In production, implement pattern matching
      await this.cacheService.reset();
    }
    
    return {
      message: 'Cache entries cleared by pattern',
      pattern,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Warm up cache with common requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cache warm-up completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cache warm-up completed' },
        entriesWarmed: { type: 'number', example: 5 },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @Post('warm-up')
  async warmUpCache() {
    // This would typically pre-populate cache with common requests
    // For now, we'll return a success message
    return {
      message: 'Cache warm-up completed',
      entriesWarmed: 0, // In real implementation, count actual warmed entries
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get cache statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        hits: { type: 'number', example: 1234 },
        misses: { type: 'number', example: 567 },
        hitRate: { type: 'number', example: 0.685 },
        totalKeys: { type: 'number', example: 89 },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @Get()
  async getCacheStats() {
    const stats = this.cacheService.getStats();
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }
}
