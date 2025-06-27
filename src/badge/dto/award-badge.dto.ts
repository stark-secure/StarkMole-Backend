import { IsOptional, IsObject, IsUUID } from 'class-validator';

export class AwardBadgeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  badgeId: string;

  @IsObject()
  @IsOptional()
  metadata?: {
    gameId?: string;
    score?: number;
    context?: string;
    triggerEvent?: string;
    additionalData?: Record<string, any>;
  };
}
