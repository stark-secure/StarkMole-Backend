import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsIn,
  IsString,
} from 'class-validator';
import { AnalyticsEvent } from '../analytics-event.enum';

export class AnalyticsAggregationDto {
  @IsOptional()
  @IsEnum(AnalyticsEvent)
  event?: AnalyticsEvent;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  groupBy?: 'hour' | 'day' | 'week' | 'month' = 'day';
}
