import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AchievementType,
  BadgeRarity,
  type BadgeCriteria,
} from '../entities/badge.entity';

export class CreateBadgeDto {
  @ApiProperty({
    description: 'Badge name',
    example: 'First Victory',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Badge description',
    example: 'Awarded for winning your first game',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Badge icon URL or identifier',
    example: 'trophy-gold.svg',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  icon: string;

  @ApiProperty({
    description: 'Type of achievement',
    enum: AchievementType,
    example: AchievementType.GAMEPLAY,
  })
  @IsEnum(AchievementType)
  type: AchievementType;

  @ApiPropertyOptional({
    description: 'Badge rarity level',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
    example: BadgeRarity.RARE,
  })
  @IsEnum(BadgeRarity)
  @IsOptional()
  rarity?: BadgeRarity = BadgeRarity.COMMON;

  @ApiPropertyOptional({
    description: 'Criteria for earning the badge',
    example: {
      gamesPlayed: 10,
      totalScore: 5000,
      consecutiveWins: 3,
    },
  })
  @IsObject()
  @IsOptional()
  criteria?: BadgeCriteria;

  @ApiPropertyOptional({
    description: 'Whether the badge is automatically awarded',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isAutoAwarded?: boolean = false;

  @ApiPropertyOptional({
    description: 'Points awarded for earning this badge',
    minimum: 0,
    default: 0,
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number = 0;

  @ApiPropertyOptional({
    description: 'Sort order for displaying badges',
    minimum: 0,
    default: 0,
    example: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number = 0;

  @ApiPropertyOptional({
    description: 'Badge category',
    example: 'Achievement',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;
}
