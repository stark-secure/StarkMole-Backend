/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Query,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { LeaderboardService } from '../Leaderboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GlobalLeaderboardResponseDto } from '../dto/leaderboard-response.dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Leaderboard Polling')
@Controller('leaderboard/polling')
export class LeaderboardPollingController {
  private readonly logger = new Logger(LeaderboardPollingController.name);
  private lastUpdateTimestamps: Map<string, number> = new Map();

  constructor(private readonly leaderboardService: LeaderboardService) {}

  @ApiOperation({ 
    summary: 'Get leaderboard with polling support',
    description: 'Fallback endpoint for clients that do not support WebSockets. Supports conditional requests with If-Modified-Since header.'
  })
  @ApiHeader({
    name: 'If-Modified-Since',
    required: false,
    description: 'RFC 7232 If-Modified-Since header for conditional requests',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of entries per page (max 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'pollInterval',
    required: false,
    description: 'Suggested poll interval in seconds (10-30)',
    example: 15,
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard data retrieved successfully',
    type: GlobalLeaderboardResponseDto,
    headers: {
      'Last-Modified': {
        description: 'Last modification timestamp',
        schema: { type: 'string' },
      },
      'Cache-Control': {
        description: 'Cache control directives',
        schema: { type: 'string' },
      },
      'X-Poll-Interval': {
        description: 'Recommended polling interval in seconds',
        schema: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 304,
    description: 'Not Modified - leaderboard has not changed',
  })
  @Get()
  @UseGuards(JwtAuthGuard)
  async getLeaderboardWithPolling(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('pollInterval') pollInterval: number = 15,
    @Headers('if-modified-since') ifModifiedSince?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<any> {
    const leaderboardId = 'global';
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimestamps.get(leaderboardId) || 0;

    // Validate and clamp poll interval
    const clampedPollInterval = Math.max(10, Math.min(30, pollInterval));
    
    // Log polling request for monitoring
    this.logger.debug(`Polling request from ${userAgent} with interval ${clampedPollInterval}s`);

    // Check if client has recent data
    if (ifModifiedSince) {
      const clientLastUpdate = new Date(ifModifiedSince).getTime();
      if (clientLastUpdate >= lastUpdate && lastUpdate > 0) {
        // Return 304 Not Modified with recommended poll interval
        return {
          statusCode: 304,
          headers: {
            'Cache-Control': `max-age=${clampedPollInterval}`,
            'X-Poll-Interval': clampedPollInterval,
          }
        };
      }
    }

    try {
      const result = await this.leaderboardService.getGlobalLeaderboard(
        page,
        Math.min(limit, 100),
      );

      // Update last modification timestamp
      this.lastUpdateTimestamps.set(leaderboardId, now);

      const response = plainToClass(GlobalLeaderboardResponseDto, result, {
        excludeExtraneousValues: true,
      });

      // Add polling metadata
      return {
        ...response,
        meta: {
          ...response,
          lastModified: new Date(now).toISOString(),
          pollInterval: clampedPollInterval,
          supportsWebSocket: true,
          websocketEndpoint: '/realtime',
        },
        headers: {
          'Last-Modified': new Date(now).toUTCString(),
          'Cache-Control': `max-age=${clampedPollInterval}`,
          'X-Poll-Interval': clampedPollInterval,
        }
      };
    } catch (error) {
      this.logger.error('Error fetching leaderboard for polling:', error);
      throw error;
    }
  }

  @ApiOperation({ 
    summary: 'Check leaderboard update status',
    description: 'Lightweight endpoint to check if leaderboard has been updated since last poll'
  })
  @ApiHeader({
    name: 'If-Modified-Since',
    required: true,
    description: 'Client\'s last known update timestamp',
  })
  @ApiResponse({
    status: 200,
    description: 'Update status information',
    schema: {
      type: 'object',
      properties: {
        hasUpdates: { type: 'boolean' },
        lastModified: { type: 'string' },
        recommendedPollInterval: { type: 'number' },
      }
    }
  })
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async checkUpdateStatus(
    @Headers('if-modified-since') ifModifiedSince: string,
    @Query('pollInterval') pollInterval: number = 15,
  ): Promise<{
    hasUpdates: boolean;
    lastModified: string;
    recommendedPollInterval: number;
  }> {
    const leaderboardId = 'global';
    const lastUpdate = this.lastUpdateTimestamps.get(leaderboardId) || 0;
    const clientLastUpdate = new Date(ifModifiedSince).getTime();
    const clampedPollInterval = Math.max(10, Math.min(30, pollInterval));

    return {
      hasUpdates: clientLastUpdate < lastUpdate,
      lastModified: new Date(lastUpdate).toISOString(),
      recommendedPollInterval: clampedPollInterval,
    };
  }

  /**
   * Manually update the last modification timestamp
   * Called by LeaderboardService when data changes
   */
  updateLastModificationTime(leaderboardId: string = 'global'): void {
    this.lastUpdateTimestamps.set(leaderboardId, Date.now());
  }
}
