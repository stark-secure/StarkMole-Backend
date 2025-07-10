import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateMintDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  tokenId: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class MintResponseDto {
  success: boolean;
  transactionHash: string;
  explorerUrl: string;
}
