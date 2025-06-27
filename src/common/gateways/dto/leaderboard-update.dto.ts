import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class LeaderboardUpdateDto {
  @IsString()
  @IsNotEmpty()
  leaderboardId: string;

  @IsArray()
  scores: any[]; 
} 