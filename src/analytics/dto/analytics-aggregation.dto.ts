import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsIn,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEvent } from '../analytics-event.enum';

export class AnalyticsAggregationDto {
  @ApiPropertyOptional({
    description: 'Filter by specific event type',
    enum: AnalyticsEvent,
    example: AnalyticsEvent.GameStarted,
  })
  @IsOptional()
  @IsEnum(AnalyticsEvent)
  event?: AnalyticsEvent;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Start date for aggregation (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End date for aggregation (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Time period for grouping results',
    enum: ['hour', 'day', 'week', 'month'],
    default: 'day',
    example: 'day',
  })
  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  groupBy?: 'hour' | 'day' | 'week' | 'month' = 'day';
}
