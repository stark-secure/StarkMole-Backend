import { IsString, IsEnum, IsArray, ArrayNotEmpty } from 'class-validator';

export type NotificationType = 'info' | 'reward' | 'challenge' | 'system';

export class CreateNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  userIds: string[];

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(['info', 'reward', 'challenge', 'system'])
  type: NotificationType;
}
