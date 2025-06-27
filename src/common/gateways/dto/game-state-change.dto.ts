import { IsString, IsIn } from 'class-validator';

export class GameStateChangeDto {
  @IsString()
  gameId: string;

  @IsIn(['started', 'paused', 'ended'])
  state: 'started' | 'paused' | 'ended';
} 