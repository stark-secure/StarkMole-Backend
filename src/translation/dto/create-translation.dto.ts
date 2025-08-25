import { IsString, IsOptional, IsNumber, Length } from "class-validator"

export class CreateTranslationDto {
  @IsString()
  @Length(1, 255)
  key: string

  @IsString()
  value: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  namespace?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  languageId: number
}
