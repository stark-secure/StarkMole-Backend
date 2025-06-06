import { IsUUID, IsDateString, IsOptional, IsBoolean, IsObject } from "class-validator"

export class ScheduleChallengeDto {
  @IsUUID()
  challengeId: string

  @IsUUID()
  @IsOptional()
  userId?: string

  @IsDateString()
  scheduledFor: string

  @IsDateString()
  @IsOptional()
  expiresAt?: string

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean

  @IsObject()
  @IsOptional()
  metadata?: any
}
