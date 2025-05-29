import { PartialType, OmitType } from "@nestjs/mapped-types"
import { IsOptional, IsString, IsBoolean } from "class-validator"
import { CreateUserDto } from "./create-user.dto"

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ["password"] as const)) {
  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  walletAddress?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
