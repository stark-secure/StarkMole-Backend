import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'newusername123',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'StarkNet wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  readonly isEmailVerified?: boolean;
  readonly emailVerificationToken?: string;
  readonly emailVerificationExpires?: Date;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User email preferences',
    example: { promotional: true, transactional: true },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailPreferencesDto)
  emailPreferences?: EmailPreferencesDto;
}

class EmailPreferencesDto {
  @ApiPropertyOptional({
    description: 'Receive promotional emails',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  promotional?: boolean;

  @ApiPropertyOptional({
    description: 'Receive transactional emails',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  transactional?: boolean;
}
