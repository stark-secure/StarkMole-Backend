import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Provider, Account, Contract } from 'starknet';
import { TypedConfigService } from '../common/config/typed-config.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsEvent } from '../analytics/analytics-event.enum';

@Injectable()
export class BlockchainService {
  private provider: Provider;
  private account: Account;

  constructor(
    private readonly configService: TypedConfigService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {
    this.provider = new Provider({
      nodeUrl: 'https://starknet-goerli.g.alchemy.com/v2/demo',
    });
    const privateKey = this.configService.starknetPrivateKey;
    const accountAddress = this.configService.starknetAccountAddress;
    this.account = new Account(this.provider, accountAddress, privateKey);
  }

  async sendMintTx(userId: number): Promise<{ transaction_hash: string }> {
    const contractAddress = this.configService.mintContractAddress;
    const tx = await this.account.execute({
      contractAddress,
      entrypoint: 'mint',
      calldata: [userId.toString()],
    });
    // Track token minted event
    if (this.analyticsService) {
      await this.analyticsService.track(AnalyticsEvent.TokenMinted, { userId: String(userId), metadata: { transaction_hash: tx.transaction_hash } });
    }
    return { transaction_hash: tx.transaction_hash };
  }
}
