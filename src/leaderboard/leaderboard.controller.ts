/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LeaderboardService } from './Leaderboard.service';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import {
  LeaderboardResponseDto,
  GlobalLeaderboardResponseDto,
} from './dto/leaderboard-response.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { plainToClass } from 'class-transformer';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<GlobalLeaderboardResponseDto> {
    const result = await this.leaderboardService.getGlobalLeaderboard(
      page,
      Math.min(limit, 100),
    );
    return plainToClass(GlobalLeaderboardResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLAYER, Role.ADMIN)
  async getUserLeaderboard(
    @Req() req: RequestWithUser,
  ): Promise<LeaderboardResponseDto> {
    const userId = req.user.userId;
    const result = await this.leaderboardService.getUserLeaderboard(userId);
    return plainToClass(LeaderboardResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLAYER, Role.ADMIN)
  async submitScore(
    @Req() req: RequestWithUser,
    @Body() createLeaderboardDto: CreateLeaderboardDto,
  ): Promise<LeaderboardResponseDto> {
    const userId = req.user.userId;
    const result = await this.leaderboardService.submitScore(
      userId,
      createLeaderboardDto,
    );
    return plainToClass(LeaderboardResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Post('admin/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async resetLeaderboard(): Promise<{ message: string }> {
    await this.leaderboardService.resetLeaderboard();
    return { message: 'Leaderboard reset successfully' };
  }
}
