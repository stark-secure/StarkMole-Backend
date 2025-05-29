import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator"

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  newPassword: string
}
