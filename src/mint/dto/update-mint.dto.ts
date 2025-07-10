import { PartialType } from '@nestjs/mapped-types';
import { CreateMintDto } from './create-mint.dto';

export class UpdateMintDto extends PartialType(CreateMintDto) {}
