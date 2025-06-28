import { Injectable } from '@nestjs/common';
import { UpdateMintDto } from './dto/update-mint.dto';
import { Mint } from './entities/mint.entity';
import { Repository } from 'typeorm';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MintService {
  constructor(
    @InjectRepository(Mint)
    private readonly mintRepository: Repository<Mint>,

    private readonly blockchainService: BlockchainService
  ) {}
  async mint(userId: number): Promise<Mint> {
    const txResponse = await this.blockchainService.sendMintTx(userId);
    const txHash = txResponse.transaction_hash;

    const mint = this.mintRepository.create({
      userId,
      transactionHash: txHash,
      // ...other fields
    });

    return this.mintRepository.save(mint);
  }

  findAll() {
    return `This action returns all mint`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mint`;
  }

  update(id: number, updateMintDto: UpdateMintDto) {
    return `This action updates a #${id} mint`;
  }

  remove(id: number) {
    return `This action removes a #${id} mint`;
  }
}
