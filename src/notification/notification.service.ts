import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './notification.dto';
import { RealtimeGateway } from '../common/gateways/realtime.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(createDto: CreateNotificationDto) {
    const notifications = createDto.userIds.map((userId) =>
      this.notificationRepo.create({
        userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        isRead: false,
        icon: createDto.icon,
      }),
    );

    const saved = await this.notificationRepo.save(notifications);
    // Emit real-time notification to each user
    for (const notification of saved) {
      await this.realtimeGateway.emitNotification(
        notification.userId,
        notification.message,
        notification.type,
        notification.icon
      );
    }
    return saved;
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId)
      throw new ForbiddenException('Access denied');

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }
}
