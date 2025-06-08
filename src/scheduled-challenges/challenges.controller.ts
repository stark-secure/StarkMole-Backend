import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common"
import type { ChallengesService } from "./services/challenges.service"
import type { ScheduledChallengeService } from "./services/scheduled-challenge.service"
import type { ChallengeGenerationService } from "./services/challenge-generation.service"
import type { DynamicDifficultyService } from "./services/dynamic-difficulty.service"
import type { CreateChallengeDto } from "./dto/create-challenge.dto"
import type { ScheduleChallengeDto } from "./dto/schedule-challenge.dto"
import type { ChallengeType } from "./entities/challenge.entity"

@Controller("challenges")
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly scheduledChallengeService: ScheduledChallengeService,
    private readonly challengeGenerationService: ChallengeGenerationService,
    private readonly dynamicDifficultyService: DynamicDifficultyService,
  ) {}

  @Post()
  create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Get()
  findAll() {
    return this.challengesService.findAll()
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

  @Get("user/:userId/difficulty/:type")
  getUserDifficultyProfile(@Param('userId') userId: string, @Param('type') type: ChallengeType) {
    return this.dynamicDifficultyService.getUserDifficultyProfile(userId, type)
  }

  @Post("generate/:type")
  generateChallenge(@Param('type') type: ChallengeType, @Query('userId') userId?: string) {
    if (userId) {
      return this.challengeGenerationService.generateChallengeForUser(userId, type)
    }
    return this.challengeGenerationService.generateGlobalChallenge(type, 3) // Medium difficulty
  }

  @Post('schedule')
  scheduleChallenge(@Body() scheduleChallengeDto: ScheduleChallengeDto) {
    return this.scheduledChallengeService.scheduleChallenge(scheduleChallengeDto);
  }

  @Post(":id/start")
  startChallenge(@Param('id') challengeId: string, @Body('userId') userId: string) {
    return this.challengesService.startChallenge(challengeId, userId)
  }

  @Post("attempts/:id/submit")
  submitChallenge(@Param('id') attemptId: string, @Body() body: { userId: string; userSolution: any }) {
    return this.challengesService.submitChallenge(attemptId, body.userId, body.userSolution)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }
}
