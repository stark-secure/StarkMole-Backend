import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common"
import type { Observable } from "rxjs"
import { tap } from "rxjs/operators"
import type { AnalyticsService } from "../analytics.service"

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const handler = context.getHandler()
    const controller = context.getClass()

    return next.handle().pipe(
      tap(() => {
        // Track API endpoint usage
        this.analyticsService.track({
          event: "api_call",
          sessionId: request.session?.id || "anonymous",
          userId: request.user?.id,
          timestamp: new Date(),
          properties: {
            controller: controller.name,
            handler: handler.name,
            method: request.method,
            endpoint: request.route?.path,
          },
        })
      }),
    )
  }
}
