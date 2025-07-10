import { Inject, Injectable } from '@nestjs/common';
import { Provider, Account, Contract } from 'starknet';
import { TypedConfigService } from '../common/config/typed-config.service';

@Injectable()
export class BlockchainService {
  private provider: Provider;
  private account: Account;

  constructor(private readonly configService: TypedConfigService) {
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
    return { transaction_hash: tx.transaction_hash };
  }
}
