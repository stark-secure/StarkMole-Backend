import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsObject,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateGameSessionDto {
  @IsUUID()
  challengeId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0)
  @Max(3600000)
  duration: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsString()
  sessionHash: string;
}
