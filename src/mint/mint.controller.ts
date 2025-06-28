import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { MintService } from './mint.service';
import { MintResponseDto } from './dto/create-mint.dto';
import { UpdateMintDto } from './dto/update-mint.dto';

@Controller('mint')
export class MintController {
  constructor(private readonly mintService: MintService) {}

  @Post('mint')
public async mint(@Req() req): Promise<MintResponseDto> {
  const mint = await this.mintService.mint(req.user.id);
  const explorerUrl = `https://voyager.online/tx/${mint.transactionHash}`;

  return {
    success: true,
    transactionHash: mint.transactionHash,
    explorerUrl,
  };
}

  @Get()
  findAll() {
    return this.mintService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mintService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMintDto: UpdateMintDto) {
    return this.mintService.update(+id, updateMintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mintService.remove(+id);
  }
}
