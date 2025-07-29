import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { EventEmitter2 } from "@nestjs/event-emitter"
import type { Signature, TransactionRequest } from "ethers"
import type {
  WalletProvider,
  WalletConnectionStatus,
  WalletConnectedEvent,
  WalletDisconnectedEvent,
  WalletTransactionSentEvent,
  WalletTransactionRejectedEvent,
  WalletNetworkSwitchedEvent,
  WalletConnectionErrorEvent,
  WalletErrorEvent,
  WalletEvent, // Declare WalletEvent here
} from "./interfaces/wallet.interface"
import {
  WalletProviderNotFoundException,
  WalletNotConnectedException,
  UserRejectedTransactionException,
  NetworkMismatchException,
  TransactionFailedException,
} from "./exceptions/wallet.exception"
import { WalletEvents } from "./enums/wallet-events.enum"
import type { ArgentXProvider } from "./providers/argentx.provider"
import type { BraavosProvider } from "./providers/braavos.provider"

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)
  private providers: Map<string, WalletProvider> = new Map()
  private activeProviderName: string | null = null
  private currentConnectionStatus: WalletConnectionStatus = { isConnected: false }

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    argentXProvider: ArgentXProvider,
    braavosProvider: BraavosProvider,
  ) {
    // Register providers if they are enabled
    if (argentXProvider.isAvailable()) {
      this.providers.set(argentXProvider.name, argentXProvider)
    }
    if (braavosProvider.isAvailable()) {
      this.providers.set(braavosProvider.name, braavosProvider)
    }

    this.logger.log(`Initialized WalletService with ${this.providers.size} enabled providers.`)
  }

  /**
   * Retrieves a wallet provider by its name.
   * @param providerName The name of the wallet provider (e.g., "ArgentX", "Braavos").
   * @returns The WalletProvider instance.
   * @throws WalletProviderNotFoundException if the provider is not found or not enabled.
   */
  private getProvider(providerName: string): WalletProvider {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new WalletProviderNotFoundException(providerName)
    }
    return provider
  }

  /**
   * Connects to a specified wallet provider.
   * @param providerName The name of the wallet provider to connect to.
   * @returns The connection status.
   */
  async connect(providerName: string): Promise<WalletConnectionStatus> {
    const provider = this.getProvider(providerName)
    try {
      this.logger.log(`Attempting to connect to ${providerName}...`)
      const status = await provider.connect()
      this.activeProviderName = providerName
      this.currentConnectionStatus = status
      this.emitEvent<WalletConnectedEvent>(WalletEvents.CONNECTED, {
        providerName,
        address: status.address,
        chainId: status.chainId,
      })
      this.logger.log(`Successfully connected to ${providerName}.`)
      return status
    } catch (error) {
      this.logger.error(`Failed to connect to ${providerName}: ${error.message}`)
      this.emitEvent<WalletConnectionErrorEvent>(WalletEvents.CONNECTION_ERROR, {
        providerName,
        error: { code: error.name, message: error.message },
      })
      throw error // Re-throw to propagate the error
    }
  }

  /**
   * Disconnects from the currently active wallet provider.
   */
  async disconnect(): Promise<void> {
    if (!this.activeProviderName) {
      this.logger.warn("No active wallet to disconnect.")
      return
    }
    const provider = this.getProvider(this.activeProviderName)
    try {
      this.logger.log(`Attempting to disconnect from ${this.activeProviderName}...`)
      await provider.disconnect()
      this.emitEvent<WalletDisconnectedEvent>(WalletEvents.DISCONNECTED, {
        providerName: this.activeProviderName,
        address: this.currentConnectionStatus.address,
        chainId: this.currentConnectionStatus.chainId,
      })
      this.activeProviderName = null
      this.currentConnectionStatus = { isConnected: false }
      this.logger.log("Successfully disconnected from wallet.")
    } catch (error) {
      this.logger.error(`Failed to disconnect from ${this.activeProviderName}: ${error.message}`)
      this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
        providerName: this.activeProviderName,
        error: { code: error.name, message: error.message },
      })
      throw error
    }
  }

  /**
   * Gets the current connection status of the active wallet.
   * @returns The current connection status.
   */
  getConnectionStatus(): WalletConnectionStatus {
    return this.currentConnectionStatus
  }

  /**
   * Gets the connected accounts from the active wallet.
   * @returns An array of connected account addresses.
   * @throws WalletNotConnectedException if no wallet is connected.
   */
  async getAccounts(): Promise<string[]> {
    if (!this.activeProviderName) {
      throw new WalletNotConnectedException()
    }
    const provider = this.getProvider(this.activeProviderName)
    try {
      return await provider.getAccounts()
    } catch (error) {
      this.logger.error(`Failed to get accounts from ${this.activeProviderName}: ${error.message}`)
      this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
        providerName: this.activeProviderName,
        error: { code: error.name, message: error.message },
      })
      throw error
    }
  }

  /**
   * Gets the current chain ID from the active wallet.
   * @returns The current chain ID.
   * @throws WalletNotConnectedException if no wallet is connected.
   */
  async getChainId(): Promise<string> {
    if (!this.activeProviderName) {
      throw new WalletNotConnectedException()
    }
    const provider = this.getProvider(this.activeProviderName)
    try {
      return await provider.getChainId()
    } catch (error) {
      this.logger.error(`Failed to get chain ID from ${this.activeProviderName}: ${error.message}`)
      this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
        providerName: this.activeProviderName,
        error: { code: error.name, message: error.message },
      })
      throw error
    }
  }

  /**
   * Signs a message using the active wallet.
   * @param message The message to sign.
   * @param address The address to sign with.
   * @returns The signature.
   * @throws WalletNotConnectedException if no wallet is connected.
   * @throws UserRejectedTransactionException if the user rejects the signing.
   */
  async signMessage(message: string, address: string): Promise<Signature> {
    if (!this.activeProviderName) {
      throw new WalletNotConnectedException()
    }
    const provider = this.getProvider(this.activeProviderName)
    try {
      this.logger.log(`Attempting to sign message with ${this.activeProviderName} for ${address}...`)
      const signature = await provider.signMessage(message, address)
      this.logger.log(`Message signed successfully by ${this.activeProviderName}.`)
      return signature
    } catch (error) {
      if (error instanceof UserRejectedTransactionException) {
        this.logger.warn(`User rejected message signing via ${this.activeProviderName}.`)
        this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
          providerName: this.activeProviderName,
          address,
          error: { code: "USER_REJECTED_SIGNATURE", message: error.message },
        })
      } else {
        this.logger.error(`Failed to sign message with ${this.activeProviderName}: ${error.message}`)
        this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
          providerName: this.activeProviderName,
          address,
          error: { code: error.name, message: error.message },
        })
      }
      throw error
    }
  }

  /**
   * Sends a transaction using the active wallet.
   * Includes retry logic for transient failures and network mismatch handling.
   * @param transaction The transaction request.
   * @param address The address to send the transaction from.
   * @param retries Number of retries for transient errors.
   * @returns The transaction hash.
   * @throws WalletNotConnectedException if no wallet is connected.
   * @throws UserRejectedTransactionException if the user rejects the transaction.
   * @throws NetworkMismatchException if the wallet is on the wrong network.
   * @throws TransactionFailedException if the transaction ultimately fails.
   */
  async sendTransaction(transaction: TransactionRequest, address: string, retries = 3): Promise<{ hash: string }> {
    if (!this.activeProviderName) {
      throw new WalletNotConnectedException()
    }
    const provider = this.getProvider(this.activeProviderName)

    for (let i = 0; i <= retries; i++) {
      try {
        this.logger.log(
          `Attempting to send transaction with ${this.activeProviderName} from ${address} (Attempt ${i + 1}/${retries + 1})...`,
        )

        // Check for network mismatch before sending
        const currentChainId = await provider.getChainId()
        if (transaction.chainId && transaction.chainId.toString() !== currentChainId) {
          this.logger.warn(
            `Network mismatch detected. Wallet on ${currentChainId}, transaction for ${transaction.chainId}.`,
          )
          // Attempt to switch network if possible, or throw
          try {
            await provider.switchNetwork(transaction.chainId.toString())
            this.emitEvent<WalletNetworkSwitchedEvent>(WalletEvents.NETWORK_SWITCHED, {
              providerName: this.activeProviderName,
              address,
              oldChainId: currentChainId,
              newChainId: transaction.chainId.toString(),
            })
            // Update internal state after successful switch
            this.currentConnectionStatus.chainId = transaction.chainId.toString()
            this.logger.log(`Successfully switched network to ${transaction.chainId}. Retrying transaction.`)
            // After switching, retry the transaction in the next loop iteration
            continue
          } catch (switchError) {
            this.logger.error(`Failed to switch network: ${switchError.message}`)
            throw new NetworkMismatchException(transaction.chainId.toString(), currentChainId)
          }
        }

        const result = await provider.sendTransaction(transaction, address)
        this.emitEvent<WalletTransactionSentEvent>(WalletEvents.TRANSACTION_SENT, {
          providerName: this.activeProviderName,
          address,
          chainId: currentChainId,
          transactionHash: result.hash,
          transactionDetails: transaction,
        })
        this.logger.log(`Transaction sent successfully by ${this.activeProviderName}: ${result.hash}`)
        return result
      } catch (error) {
        if (error instanceof UserRejectedTransactionException) {
          this.logger.warn(`User rejected transaction via ${this.activeProviderName}.`)
          this.emitEvent<WalletTransactionRejectedEvent>(WalletEvents.TRANSACTION_REJECTED, {
            providerName: this.activeProviderName,
            address,
            chainId: this.currentConnectionStatus.chainId,
            transactionDetails: transaction,
            error: { code: "USER_REJECTED", message: error.message },
          })
          throw error // User rejection is not retryable
        } else if (error instanceof NetworkMismatchException) {
          // This case is handled above by attempting a switch, if it reaches here,
          // it means the switch failed or was not possible.
          this.logger.error(`Network mismatch error: ${error.message}`)
          this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
            providerName: this.activeProviderName,
            address,
            chainId: this.currentConnectionStatus.chainId,
            error: { code: "NETWORK_MISMATCH", message: error.message },
          })
          throw error
        } else if (i < retries) {
          this.logger.warn(
            `Transient error sending transaction with ${this.activeProviderName}: ${error.message}. Retrying...`,
          )
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        } else {
          this.logger.error(
            `Transaction failed after ${retries + 1} attempts with ${this.activeProviderName}: ${error.message}`,
          )
          this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
            providerName: this.activeProviderName,
            address,
            chainId: this.currentConnectionStatus.chainId,
            error: { code: "TRANSACTION_FAILED", message: error.message },
          })
          throw new TransactionFailedException(
            `Failed to send transaction via ${this.activeProviderName}: ${error.message}`,
          )
        }
      }
    }
    // Should not be reached if retries are handled correctly
    throw new TransactionFailedException("Unknown error during transaction sending.")
  }

  /**
   * Switches the active wallet's network.
   * @param chainId The target chain ID.
   * @throws WalletNotConnectedException if no wallet is connected.
   */
  async switchNetwork(chainId: string): Promise<void> {
    if (!this.activeProviderName) {
      throw new WalletNotConnectedException()
    }
    const provider = this.getProvider(this.activeProviderName)
    const oldChainId = this.currentConnectionStatus.chainId
    try {
      this.logger.log(`Attempting to switch network to ${chainId} with ${this.activeProviderName}...`)
      await provider.switchNetwork(chainId)
      this.currentConnectionStatus.chainId = chainId // Update internal state
      this.emitEvent<WalletNetworkSwitchedEvent>(WalletEvents.NETWORK_SWITCHED, {
        providerName: this.activeProviderName,
        address: this.currentConnectionStatus.address,
        oldChainId: oldChainId,
        newChainId: chainId,
      })
      this.logger.log(`Successfully switched ${this.activeProviderName} to network ${chainId}.`)
    } catch (error) {
      this.logger.error(`Failed to switch network with ${this.activeProviderName}: ${error.message}`)
      this.emitEvent<WalletErrorEvent>(WalletEvents.ERROR, {
        providerName: this.activeProviderName,
        address: this.currentConnectionStatus.address,
        chainId: oldChainId,
        error: { code: error.name, message: error.message },
      })
      throw error
    }
  }

  /**
   * Emits a wallet-related event.
   * @param eventName The name of the event to emit.
   * @param payload The event payload.
   */
  private emitEvent<T extends WalletEvent>(eventName: WalletEvents, payload: Omit<T, "timestamp" | "event">): void {
    const fullPayload: T = {
      ...payload,
      event: eventName,
      timestamp: new Date(),
    } as T
    this.eventEmitter.emit(eventName, fullPayload)
    this.logger.debug(`Emitted event: ${eventName} with payload: ${JSON.stringify(fullPayload)}`)
  }

  /**
   * Example of listening to wallet events.
   * This could be in another service or module that needs to react to wallet changes.
   */
  onModuleInit() {
    this.eventEmitter.on(WalletEvents.CONNECTED, (event: WalletConnectedEvent) => {
      this.logger.log(`[EVENT] Wallet Connected: ${event.providerName} - ${event.address} on ${event.chainId}`)
      // Update user session, enable features, etc.
    })

    this.eventEmitter.on(WalletEvents.DISCONNECTED, (event: WalletDisconnectedEvent) => {
      this.logger.log(`[EVENT] Wallet Disconnected: ${event.providerName} - ${event.address}`)
      // Clear user session, disable features, etc.
    })

    this.eventEmitter.on(WalletEvents.TRANSACTION_REJECTED, (event: WalletTransactionRejectedEvent) => {
      this.logger.warn(
        `[EVENT] Transaction Rejected by User: ${event.providerName} - ${event.address} - ${event.error?.message}`,
      )
      // Notify user on frontend, log for analytics
    })

    this.eventEmitter.on(WalletEvents.NETWORK_SWITCHED, (event: WalletNetworkSwitchedEvent) => {
      this.logger.log(
        `[EVENT] Network Switched: ${event.providerName} - ${event.address} from ${event.oldChainId} to ${event.newChainId}`,
      )
      // Update user context, re-fetch data for new network
    })

    this.eventEmitter.on(WalletEvents.ERROR, (event: WalletErrorEvent) => {
      this.logger.error(`[EVENT] Wallet Error: ${event.providerName} - ${event.error?.code}: ${event.error?.message}`)
      // Log for debugging, trigger alerts
    })
  }
}
