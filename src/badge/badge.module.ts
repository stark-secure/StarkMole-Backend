import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeController } from './badge.controller';
import { BadgeService } from './services/badge.service';
import { AchievementService } from './services/achievement.service';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Game } from '../game/entities/game.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, User, Game])],
  controllers: [BadgeController],
  providers: [BadgeService, AchievementService],
  exports: [BadgeService, AchievementService],
})
export class BadgeModule {}
