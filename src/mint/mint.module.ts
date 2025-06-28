import { Module } from '@nestjs/common';
import { MintService } from './mint.service';
import { MintController } from './mint.controller';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  imports:[BlockchainModule],
  controllers: [MintController],
  providers: [MintService],
})
export class MintModule {}
