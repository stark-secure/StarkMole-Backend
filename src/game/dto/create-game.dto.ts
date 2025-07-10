import { IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty({
    description: 'Game score',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    description: 'Additional game data',
    example: {
      gameType: 'mole-hunt',
      difficulty: 'medium',
      achievements: ['first-catch', 'speed-demon'],
      metadata: { level: 5, timeBonus: 200 },
    },
  })
  @IsOptional()
  @IsObject()
  gameData?: any;
}
