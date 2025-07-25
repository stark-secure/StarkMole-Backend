import { IsString, IsNotEmpty } from 'class-validator';
import { NotificationType } from '../../../notification/notification.entity';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  type: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  icon?: string;
} 