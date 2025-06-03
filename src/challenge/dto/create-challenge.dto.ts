import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ChallengeDifficulty } from '../entities/challenge.entity';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  pattern: string;

  @IsEnum(ChallengeDifficulty)
  difficulty: ChallengeDifficulty;

  @IsNotEmpty()
  date: Date;
}
