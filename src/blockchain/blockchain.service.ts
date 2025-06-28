import { Injectable } from '@nestjs/common';
import { Provider, Account, Contract } from 'starknet';

@Injectable()
export class BlockchainService {
  private provider: Provider;
  private account: Account;

  constructor() {
    this.provider = new Provider({ sequencer: { network: 'goerli-alpha' } });
    const privateKey = process.env.STARKNET_PRIVATE_KEY;
    const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

    this.account = new Account(this.provider, accountAddress, privateKey);
  }

  async sendMintTx(userId: number): Promise<{ transaction_hash: string }> {
    const contractAddress = process.env.MINT_CONTRACT_ADDRESS;

    const tx = await this.account.execute({
      contractAddress,
      entrypoint: 'mint',
      calldata: [userId.toString()], // adjust this based on your contract
    });

    return { transaction_hash: tx.transaction_hash };
  }
}