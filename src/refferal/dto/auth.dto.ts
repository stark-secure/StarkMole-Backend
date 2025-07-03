import { IsEmail, IsString, MinLength, IsOptional, Matches } from "class-validator"

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  username: string

  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,10}$/, { message: "Invalid referral code format" })
  referralCode?: string
}

export class ReferralStatsDto {
  totalReferrals: number
  completedReferrals: number
  totalRewards: number
  pendingRewards: number
  referralCode: string
}
