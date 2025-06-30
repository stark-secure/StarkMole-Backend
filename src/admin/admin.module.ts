// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MetricsService } from './services/metrics.service';
import { AdminGuard } from './guards/admin.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Game } from 'src/game/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Game])],
  controllers: [AdminController],
  providers: [AdminService, MetricsService, AdminGuard],
  exports: [AdminService, MetricsService],
})
export class AdminModule {}
