import { IsUUID, IsInt, Min } from 'class-validator';

export class SubmitScoreDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(0)
  score: number;
}
