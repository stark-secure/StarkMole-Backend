import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { ReferralService } from '../services/referral.service';
import type { ReferralStatsDto } from '../dto/auth.dto';
import type { Reward } from '../entities/reward.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  async getReferralStats(req): Promise<ReferralStatsDto> {
    return this.referralService.getReferralStats(req.user.id);
  }

  @Get('rewards')
  async getUserRewards(req): Promise<Reward[]> {
    return this.referralService.getUserRewards(req.user.id);
  }

  @Post('complete-first-game')
  async completeFirstGame(req): Promise<{ message: string }> {
    await this.referralService.handleFirstGameComplete(req.user.id);
    return { message: 'First game completion processed' };
  }
}
