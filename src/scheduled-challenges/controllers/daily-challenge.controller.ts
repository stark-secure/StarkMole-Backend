import { Controller, Get, Param, Query } from '@nestjs/common';
import { DailyChallengeService } from '../services/daily-challenge.service';

@Controller('challenges/daily')
export class DailyChallengeController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  @Get('current')
  getCurrentChallenge() {
    return this.dailyChallengeService.getCurrentChallenge();
  }

  @Get('history')
  getChallengeHistory(@Query('limit') limit = 10) {
    return this.dailyChallengeService.getChallengeHistory(Number(limit));
  }

  @Get('leaderboard/:challengeId')
  getLeaderboard(@Param('challengeId') challengeId: string, @Query('limit') limit = 50) {
    return this.dailyChallengeService.getChallengeLeaderboard(challengeId, Number(limit));
  }
}
