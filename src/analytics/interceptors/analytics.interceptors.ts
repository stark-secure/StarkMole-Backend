// src/analytics/interceptors/analytics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsEvent } from '../enum/analytics-event.enum';

/**
 * Interceptor to automatically track API errors
 */
@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const userId = request.user?.['id'];

    return next.handle().pipe(
      catchError((error) => {
        // Track API errors
        this.analyticsService
          .track(AnalyticsEvent.ApiError, {
            userId,
            metadata: {
              method,
              url,
              statusCode: error.status || 500,
              errorMessage: error.message,
              errorStack: error.stack,
            },
            ipAddress: ip,
            userAgent,
          })
          .catch(() => {
            // Silently fail if analytics tracking fails
            // to prevent breaking the main request flow
          });

        throw error;
      }),
    );
  }
}
