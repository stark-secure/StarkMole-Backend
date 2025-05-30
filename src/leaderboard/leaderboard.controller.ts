// leaderboard.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Auth } from 'src/auth/entities/auth.entity';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaderboardController {
  @Get()
  @Roles(Role.PLAYER, Role.ADMIN)
  getLeaderboard(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return `Leaderboard for user ${userId}`;
  }

  @Get('admin/reset')
  @Roles(Role.ADMIN)
  resetLeaderboard(@Req() req: RequestWithUser) {
    return `Leaderboard reset by admin ${req.user.userId}`;
  }
}