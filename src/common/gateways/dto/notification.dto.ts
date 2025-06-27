import { IsString, IsNotEmpty } from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  type: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
} 