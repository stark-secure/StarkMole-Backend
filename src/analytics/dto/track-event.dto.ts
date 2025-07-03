import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { AnalyticsEvent } from '../analytics-event.enum';

export class TrackEventDto {
  @IsEnum(AnalyticsEvent)
  event: AnalyticsEvent;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
