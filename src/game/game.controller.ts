import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto, GameStatsDto } from './dto/game-response.dto';
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../cache/interceptors/cache.interceptor';
import { Cacheable, CacheKeys } from '../cache/decorators/cache.decorator';

@ApiTags('Games')
@ApiBearerAuth('JWT-auth')
@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @ApiOperation({ summary: 'Create a new game' })
  @ApiBody({ type: CreateGameDto })
  @ApiResponse({
    status: 201,
    description: 'Game created successfully',
    type: GameResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @Post()
  async createGame(@Body() gameData: CreateGameDto, @Request() req) {
    return await this.gameService.createGame(
      req.user.id,
      gameData.score,
      gameData.gameData,
    );
  }

  @ApiOperation({ summary: 'Get games for a specific user' })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User games retrieved successfully',
    type: [GameResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('user/:userId')
  @UseInterceptors(CacheInterceptor)
  @Cacheable(CacheKeys.USER_GAMES, 180) // 3 minutes TTL
  async getUserGames(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.gameService.getUserGames(userId);
  }

  @ApiOperation({ summary: 'Get game statistics for a specific user' })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User game statistics retrieved successfully',
    type: GameStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('user/:userId/stats')
  @UseInterceptors(CacheInterceptor)
  @Cacheable(CacheKeys.USER_GAME_STATS, 300) // 5 minutes TTL
  async getGameStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.gameService.getGameStats(userId);
  }
}
