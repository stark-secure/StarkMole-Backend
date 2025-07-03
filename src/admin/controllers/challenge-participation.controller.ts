// src/scheduled-challenges/controllers/admin-challenge.controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DailyChallengeService } from 'src/scheduled-challenges/services/daily-challenge.service';
// import { AdminGuard } from '../../auth/guards/admin.guard'; // Uncomment when you have admin guard

@ApiTags('Admin - Daily Challenges')
@Controller('admin/challenges/daily')
// @UseGuards(AdminGuard) // Uncomment when you have admin guard
@ApiBearerAuth()
export class AdminChallengeController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  @Post('reset')
  @ApiOperation({ summary: 'Manually trigger daily challenge reset' })
  @ApiResponse({ status: 200, description: 'Challenge reset successfully' })
  async manualReset() {
    const newChallenge =
      await this.dailyChallengeService.manuallyTriggerReset();
    return {
      success: true,
      message: 'Daily challenge reset successfully',
      data: newChallenge,
    };
  }
}
