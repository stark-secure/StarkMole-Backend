import { IsString, IsOptional, IsObject, IsDate, IsEnum } from "class-validator"
import { Type } from "class-transformer"
import { AnalyticsEvents } from "../enums/analytics-events.enum"

export class TrackEventDto {
  @IsEnum(AnalyticsEvents)
  event: AnalyticsEvents

  @IsOptional()
  @IsString()
  userId?: string

  @IsString()
  sessionId: string

  @Type(() => Date)
  @IsDate()
  timestamp: Date

  @IsObject()
  properties: Record<string, any>

  @IsOptional()
  @IsObject()
  metadata?: {
    userAgent?: string
    country?: string
    device?: string
    browser?: string
  }
}

export class IdentifyUserDto {
  @IsString()
  userId: string

  @IsObject()
  properties: Record<string, any>
}
