import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './notification.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async sendNotification(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto);
  }

  @Get()
  async getNotifications(
    @Req() req: { user: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.listByUser(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.notificationService.markAsRead(id, req.user.id);
  }
}
