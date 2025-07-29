import { Controller, Post, Get, UseInterceptors, Logger } from "@nestjs/common"
import type { WalletService } from "./wallet.service"
import type { ConnectWalletDto, SignMessageDto, SendTransactionDto, SwitchNetworkDto } from "./dtos/wallet.dto"
import type { WalletConnectionStatus } from "./interfaces/wallet.interface"
import { WalletErrorInterceptor } from "./interceptors/wallet-error.interceptor"
import type { Signature } from "ethers"

@UseInterceptors(WalletErrorInterceptor) // Apply the error interceptor to all endpoints in this controller
@Controller("wallet")
export class WalletController {
  private readonly logger = new Logger(WalletController.name)

  constructor(private readonly walletService: WalletService) {}

  @Post("connect")
  async connectWallet(body: ConnectWalletDto): Promise<WalletConnectionStatus> {
    this.logger.log(`Received connect request for provider: ${body.providerName}`)
    return this.walletService.connect(body.providerName)
  }

  @Post("disconnect")
  async disconnectWallet(): Promise<{ message: string }> {
    this.logger.log("Received disconnect request.")
    await this.walletService.disconnect()
    return { message: "Wallet disconnected successfully." }
  }

  @Get("status")
  getConnectionStatus(): WalletConnectionStatus {
    this.logger.log("Received status request.")
    return this.walletService.getConnectionStatus()
  }

  @Get("accounts")
  async getAccounts(): Promise<string[]> {
    this.logger.log("Received get accounts request.")
    return this.walletService.getAccounts()
  }

  @Get("chain-id")
  async getChainId(): Promise<string> {
    this.logger.log("Received get chain ID request.")
    return this.walletService.getChainId()
  }

  @Post("sign-message")
  async signMessage(body: SignMessageDto): Promise<{ signature: Signature }> {
    this.logger.log(`Received sign message request for address: ${body.address}`)
    const signature = await this.walletService.signMessage(body.message, body.address)
    return { signature }
  }

  @Post("send-transaction")
  async sendTransaction(body: SendTransactionDto): Promise<{ transactionHash: string }> {
    this.logger.log(`Received send transaction request from address: ${body.fromAddress}`)
    const transactionRequest = {
      to: body.to,
      value: body.value,
      data: body.data,
      gasLimit: body.gasLimit,
      gasPrice: body.gasPrice,
      maxFeePerGas: body.maxFeePerGas,
      maxPriorityFeePerGas: body.maxPriorityFeePerGas,
      nonce: body.nonce,
      chainId: body.chainId,
    }
    const result = await this.walletService.sendTransaction(transactionRequest, body.fromAddress)
    return { transactionHash: result.hash }
  }

  @Post("switch-network")
  async switchNetwork(body: SwitchNetworkDto): Promise<{ message: string }> {
    this.logger.log(`Received switch network request to chain ID: ${body.chainId}`)
    await this.walletService.switchNetwork(body.chainId)
    return { message: `Successfully switched to network ${body.chainId}.` }
  }
}
