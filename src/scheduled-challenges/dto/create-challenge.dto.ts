import { IsEnum, IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsObject } from "class-validator"
import { ChallengeType, DifficultyLevel } from "../entities/challenge.entity"

export class CreateChallengeDto {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsEnum(ChallengeType)
  type: ChallengeType

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel

  @IsObject()
  content: any

  @IsObject()
  @IsOptional()
  solution?: any

  @IsNumber()
  @IsOptional()
  basePoints?: number

  @IsNumber()
  @IsOptional()
  timeLimit?: number

  @IsArray()
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
