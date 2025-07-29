import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { type Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import { WalletException } from "../exceptions/wallet.exception"

@Injectable()
export class WalletErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WalletErrorInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof WalletException) {
          // Custom wallet exceptions
          this.logger.warn(`WalletException caught: ${error.message}`, error.stack)
          return throwError(() => new HttpException(error.message, error.getStatus()))
        } else if (error instanceof Error) {
          // Catch generic errors and wrap them
          this.logger.error(`Unhandled error in wallet operation: ${error.message}`, error.stack)
          return throwError(
            () => new HttpException("An unexpected wallet error occurred.", HttpStatus.INTERNAL_SERVER_ERROR),
          )
        }
        // If it's already an HttpException or something else, re-throw
        return throwError(() => error)
      }),
    )
  }
}
