import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEvent } from '../analytics-event.enum';

export class TrackEventDto {
  @ApiProperty({
    description: 'Type of analytics event to track',
    enum: AnalyticsEvent,
    example: AnalyticsEvent.GameStarted,
  })
  @IsEnum(AnalyticsEvent)
  event: AnalyticsEvent;

  @ApiPropertyOptional({
    description: 'User ID associated with the event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the event',
    example: { level: 5, score: 1500, gameType: 'mole-hunt' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Session ID for tracking user sessions',
    example: 'session_123456789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Source of the event (e.g., web, mobile)',
    example: 'web',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
