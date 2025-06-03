import { Expose } from 'class-transformer';
import { ChallengeDifficulty } from '../entities/challenge.entity';

export class ChallengeResponseDto {
  @Expose()
  id: number;

  @Expose()
  pattern: string;

  @Expose()
  difficulty: ChallengeDifficulty;

  @Expose()
  date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
