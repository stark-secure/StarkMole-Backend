import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { ChallengesService } from './services/challenges.service';
import type { ScheduledChallengeService } from './services/scheduled-challenge.service';
import type { ChallengeGenerationService } from './services/challenge-generation.service';
import type { DynamicDifficultyService } from './services/dynamic-difficulty.service';
import type { CreateChallengeDto } from './dto/create-challenge.dto';
import type { ScheduleChallengeDto } from './dto/schedule-challenge.dto';
import type { ChallengeType } from './entities/challenge.entity';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DailyChallengeService } from './services/daily-challenge.service';

@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly scheduledChallengeService: ScheduledChallengeService,
    private readonly challengeGenerationService: ChallengeGenerationService,
    private readonly dynamicDifficultyService: DynamicDifficultyService,
    private readonly dailyChallengeService: DailyChallengeService,
  ) {}

  @Post()
  create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Get()
  findAll() {
    return this.challengesService.findAll();
  }

  @Get('scheduled')
  getScheduledChallenges(@Query('userId') userId?: string) {
    return this.scheduledChallengeService.getActiveScheduledChallenges(userId);
  }

  @Get('user/:userId/scheduled')
  getUserScheduledChallenges(@Param('userId') userId: string) {
    return this.scheduledChallengeService.getUserScheduledChallenges(userId);
  }

  @Get('user/:userId/attempts')
  getUserAttempts(@Param('userId') userId: string) {
    return this.challengesService.getUserAttempts(userId);
  }

  @Get('user/:userId/difficulty/:type')
  getUserDifficultyProfile(
    @Param('userId') userId: string,
    @Param('type') type: ChallengeType,
  ) {
    return this.dynamicDifficultyService.getUserDifficultyProfile(userId, type);
  }

  @Post('generate/:type')
  generateChallenge(
    @Param('type') type: ChallengeType,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      return this.challengeGenerationService.generateChallengeForUser(
        userId,
        type,
      );
    }
    return this.challengeGenerationService.generateGlobalChallenge(type, 3); // Medium difficulty
  }

  @Post('schedule')
  scheduleChallenge(@Body() scheduleChallengeDto: ScheduleChallengeDto) {
    return this.scheduledChallengeService.scheduleChallenge(
      scheduleChallengeDto,
    );
  }

  @Post(':id/start')
  startChallenge(
    @Param('id') challengeId: string,
    @Body('userId') userId: string,
  ) {
    return this.challengesService.startChallenge(challengeId, userId);
  }

  @Post('attempts/:id/submit')
  submitChallenge(
    @Param('id') attemptId: string,
    @Body() body: { userId: string; userSolution: any },
  ) {
    return this.challengesService.submitChallenge(
      attemptId,
      body.userId,
      body.userSolution,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active daily challenge' })
  @ApiResponse({
    status: 200,
    description: 'Current challenge returned successfully',
  })
  @ApiResponse({ status: 404, description: 'No active challenge found' })
  async getCurrentChallenge() {
    const challenge = await this.dailyChallengeService.getCurrentChallenge();
    return {
      success: true,
      data: challenge,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated history of past challenges' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of challenges to return (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination (default: 0)',
  })
  async getChallengeHistory(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const result = await this.dailyChallengeService.getChallengeHistory(
      limit,
      offset,
    );
    return {
      success: true,
      data: result,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    };
  }

  @Get('leaderboard/:challengeId')
  @ApiOperation({ summary: 'Get leaderboard for a specific challenge' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard returned successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallengeLeaderboard(
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    const result = await this.dailyChallengeService.getChallengeLeaderboard(
      challengeId,
      limit,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('participate')
  @ApiOperation({ summary: 'Participate in current daily challenge' })
  async participateInChallenge(
    @Body() body: { playerId: string; score: number; metadata?: any },
  ) {
    const currentChallenge =
      await this.dailyChallengeService.getCurrentChallenge();
    if (!currentChallenge) {
      throw new Error('No active challenge found');
    }

    const participation =
      await this.dailyChallengeService.participateInChallenge(
        currentChallenge.id,
        body.playerId,
        body.score,
        body.metadata,
      );

    return {
      success: true,
      data: participation,
    };
  }
}
