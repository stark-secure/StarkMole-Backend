import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GameResponseDto {
  @ApiProperty({
    description: 'Game unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'User ID who played the game',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    description: 'Game score achieved',
    example: 1500
  })
  score: number;

  @ApiProperty({
    description: 'Maximum possible score for this game',
    example: 2000
  })
  maxPossibleScore: number;

  @ApiProperty({
    description: 'Game status',
    enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
    example: 'COMPLETED'
  })
  status: string;

  @ApiProperty({
    description: 'Game duration in seconds',
    example: 120
  })
  duration: number;

  @ApiProperty({
    description: 'Game level',
    example: 5
  })
  level: number;

  @ApiPropertyOptional({
    description: 'Additional game data',
    example: {
      gameType: 'mole-hunt',
      difficulty: 'medium',
      achievements: ['first-catch', 'speed-demon'],
      metadata: { level: 5, timeBonus: 200 }
    }
  })
  gameData?: {
    gameType?: string;
    difficulty?: string;
    achievements?: string[];
    metadata?: Record<string, any>;
  };

  @ApiProperty({
    description: 'Game creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;
}

export class GameStatsDto {
  @ApiProperty({
    description: 'Total number of games played',
    example: 25
  })
  totalGames: number;

  @ApiProperty({
    description: 'Highest score achieved',
    example: 2500
  })
  highestScore: number;

  @ApiProperty({
    description: 'Average score',
    example: 1250.5
  })
  averageScore: number;

  @ApiProperty({
    description: 'Total time played in seconds',
    example: 3600
  })
  totalTimePlayed: number;

  @ApiProperty({
    description: 'Number of completed games',
    example: 20
  })
  completedGames: number;

  @ApiProperty({
    description: 'Win rate percentage',
    example: 80.0
  })
  winRate: number;
}
