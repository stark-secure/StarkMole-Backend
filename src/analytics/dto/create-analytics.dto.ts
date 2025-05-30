/* eslint-disable prettier/prettier */
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AnalyticsEvent } from '../analytics-event.enum';

export class CreateAnalyticsDto {
  @IsEnum(AnalyticsEvent)
  eventType: AnalyticsEvent;

  @IsNotEmpty()
  userId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
