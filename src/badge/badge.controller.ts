import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { BadgeService } from '../services/badge.service';
import type { AchievementService } from '../services/achievement.service';
import type { CreateBadgeDto } from '../dto/create-badge.dto';
import type { AwardBadgeDto } from '../dto/award-badge.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import type { AchievementType } from '../entities/badge.entity';

@Controller('badges')
export class BadgeController {
  constructor(
    private readonly badgeService: BadgeService,
    private readonly achievementService: AchievementService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  async createBadge(createBadgeDto: CreateBadgeDto) {
    return await this.badgeService.createBadge(createBadgeDto);
  }

  @Get()
  async getAllBadges(
    @Query('includeInactive') includeInactive?: string,
    @Query('type') type?: AchievementType,
  ) {
    if (type) {
      return await this.badgeService.getBadgesByType(type);
    }
    return await this.badgeService.getAllBadges(includeInactive === 'true');
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.badgeService.getLeaderboardWithBadges(limit);
  }

  @Get(':id')
  async getBadgeById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.badgeService.getBadgeById(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async updateBadge(
    @Param('id', ParseUUIDPipe) id: string,
    updateData: Partial<CreateBadgeDto>,
  ) {
    return await this.badgeService.updateBadge(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async deactivateBadge(@Param('id', ParseUUIDPipe) id: string) {
    return await this.badgeService.deactivateBadge(id);
  }

  @Post('award')
  @UseGuards(AdminGuard)
  async awardBadge(awardBadgeDto: AwardBadgeDto, @Request() req) {
    return await this.badgeService.awardBadgeManually(
      awardBadgeDto,
      req.user.id,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getUserBadges(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.badgeService.getUserBadges(userId);
  }

  @Get('user/:userId/profile')
  @UseGuards(AuthGuard)
  async getUserProfileBadges(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.badgeService.getUserProfileBadges(userId);
  }

  @Get('user/:userId/progress/:badgeId')
  @UseGuards(AuthGuard)
  async getBadgeProgress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('badgeId', ParseUUIDPipe) badgeId: string,
  ) {
    return await this.badgeService.getBadgeProgress(userId, badgeId);
  }

  @Delete('user/:userId/badge/:badgeId')
  @UseGuards(AdminGuard)
  async removeBadgeFromUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('badgeId', ParseUUIDPipe) badgeId: string,
  ) {
    return await this.badgeService.removeBadgeFromUser(userId, badgeId);
  }

  @Post('check-achievements/:userId')
  @UseGuards(AuthGuard)
  async checkAchievements(
    @Param('userId', ParseUUIDPipe) userId: string,
    context?: any,
  ) {
    return await this.achievementService.checkAndAwardAchievements(
      userId,
      context,
    );
  }

  @Post('initialize-defaults')
  @UseGuards(AdminGuard)
  async initializeDefaultBadges() {
    await this.achievementService.initializeDefaultBadges();
    return { message: 'Default badges initialized successfully' };
  }
}
