import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  providers: [BlockchainService],
  exports: [BlockchainService],
  controllers: [],
})
export class BlockchainModule {}
