import { IsString, IsBoolean, IsOptional, Length } from "class-validator"

export class CreateLanguageDto {
  @IsString()
  @Length(2, 10)
  code: string

  @IsString()
  @Length(1, 100)
  name: string

  @IsString()
  @Length(1, 100)
  nativeName: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}
