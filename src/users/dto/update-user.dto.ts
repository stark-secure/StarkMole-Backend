import { PartialType, OmitType } from "@nestjs/mapped-types"
import { IsOptional, IsString, IsBoolean, IsUrl, MaxLength, ValidateNested } from "class-validator"
import { CreateUserDto } from "./create-user.dto"
import { Type } from "class-transformer"

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ["password"] as const)) {
  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  walletAddress?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string

  @IsOptional()
  @IsUrl()
  avatarUrl?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => EmailPreferencesDto)
  emailPreferences?: EmailPreferencesDto
}

class EmailPreferencesDto {
  @IsOptional()
  @IsBoolean()
  promotional?: boolean

  @IsOptional()
  @IsBoolean()
  transactional?: boolean
}
