import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEvent } from '../analytics-event.enum';

export class AnalyticsQueryDto {
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
    description: 'Start date for filtering (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 1000,
    default: 100,
    example: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
