import { Controller, Get, UseGuards, Query, Req, Logger } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';
import { MetricsService } from './services/metrics.service';
import { AdminService } from './admin.service';
import { Request } from 'express';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    this.logAdminActivity(req.user, 'DASHBOARD_ACCESS');
    return this.adminService.getDashboardData();
  }

  @Get('metrics/users/active')
  async getActiveUsers(
    @Query('hours') hours: string = '24',
    @Req() req: Request,
  ) {
    this.logAdminActivity(req.user, 'ACTIVE_USERS_VIEW');
    return this.metricsService.getActiveUsers(parseInt(hours));
  }

  @Get('metrics/games/summary')
  async getGamesSummary(
    @Query('days') days: string = '7',
    @Req() req: Request,
  ) {
    this.logAdminActivity(req.user, 'GAMES_SUMMARY_VIEW');
    return this.metricsService.getGamesSummary(parseInt(days));
  }

  @Get('metrics/system/health')
  async getSystemHealth(@Req() req: Request) {
    this.logAdminActivity(req.user, 'SYSTEM_HEALTH_VIEW');
    return this.metricsService.getSystemHealth();
  }

  @Get('export/csv')
  async exportDataCsv(
    @Query('type') type: string,
    @Query('days') days: string = '30',
    @Req() req: Request,
  ) {
    this.logAdminActivity(req.user, `EXPORT_CSV_${type.toUpperCase()}`);
    return this.adminService.exportToCsv(type, parseInt(days));
  }

  private logAdminActivity(user: any, action: string) {
    this.logger.log(`Admin activity: ${user?.email} - ${action}`);
  }
}
