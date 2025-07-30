/* eslint-disable prettier/prettier */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const res = context.switchToHttp().getResponse();
          const { statusCode } = res;
          const duration = Date.now() - now;

          const userId = user ? user.id : 'anonymous';
          const session = this.cls.get('session');

          this.logger.info('HTTP Request', {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            userId,
            session,
            body,
          });
        }),
      );
  }
}
