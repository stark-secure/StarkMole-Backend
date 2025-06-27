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
import {
  AchievementType,
  BadgeRarity,
  type BadgeCriteria,
} from '../entities/badge.entity';

export class CreateBadgeDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsString()
  @MaxLength(255)
  icon: string;

  @IsEnum(AchievementType)
  type: AchievementType;

  @IsEnum(BadgeRarity)
  @IsOptional()
  rarity?: BadgeRarity = BadgeRarity.COMMON;

  @IsObject()
  @IsOptional()
  criteria?: BadgeCriteria;

  @IsBoolean()
  @IsOptional()
  isAutoAwarded?: boolean = false;

  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number = 0;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;
}
