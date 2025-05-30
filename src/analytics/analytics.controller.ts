/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  logEvent(@Body() dto: CreateAnalyticsDto) {
    return this.analyticsService.logEvent(dto);
  }

  @Get()
  getAllLogs() {
    return this.analyticsService.getAllLogs();
  }

  @Get('user')
  getUserLogs(@Query('userId') userId: string) {
    return this.analyticsService.getUserLogs(userId);
  }
}
