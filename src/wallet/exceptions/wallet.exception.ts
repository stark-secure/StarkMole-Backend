import { HttpException, HttpStatus } from "@nestjs/common"

export class WalletException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode)
  }
}

export class WalletNotConnectedException extends WalletException {
  constructor(providerName?: string) {
    super(
      providerName ? `Wallet provider ${providerName} is not connected.` : "Wallet is not connected.",
      HttpStatus.UNAUTHORIZED,
    )
  }
}

export class WalletProviderNotFoundException extends WalletException {
  constructor(providerName: string) {
    super(`Wallet provider '${providerName}' not found or not enabled.`, HttpStatus.NOT_FOUND)
  }
}

export class UserRejectedTransactionException extends WalletException {
  constructor(message = "User rejected the transaction.") {
    super(message, HttpStatus.FORBIDDEN)
  }
}

export class NetworkMismatchException extends WalletException {
  constructor(expectedChainId: string, actualChainId: string) {
    super(
      `Network mismatch. Expected chain ID ${expectedChainId}, but wallet is on ${actualChainId}.`,
      HttpStatus.BAD_REQUEST,
    )
  }
}

export class InvalidSignatureException extends WalletException {
  constructor(message = "Invalid signature provided.") {
    super(message, HttpStatus.BAD_REQUEST)
  }
}

export class TransactionFailedException extends WalletException {
  constructor(message = "Transaction failed on the network.") {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
