import { PartialType, OmitType } from "@nestjs/mapped-types"
import { CreateTranslationDto } from "./create-translation.dto"

export class UpdateTranslationDto extends PartialType(OmitType(CreateTranslationDto, ["languageId"] as const)) {}
