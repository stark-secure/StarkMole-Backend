import { IsArray, ValidateNested, IsString, IsOptional } from "class-validator"
import { Type } from "class-transformer"

export class BulkTranslationItem {
  @IsString()
  key: string

  @IsString()
  value: string

  @IsOptional()
  @IsString()
  namespace?: string

  @IsOptional()
  @IsString()
  description?: string
}

export class BulkTranslationDto {
  @IsString()
  languageCode: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTranslationItem)
  translations: BulkTranslationItem[]
}
