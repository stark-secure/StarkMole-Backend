import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import type { AnalyticsService } from "../analytics.service"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
  constructor(private analyticsService: AnalyticsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or retrieve session ID
    if (!req.session?.id) {
      req.session = { ...req.session, id: uuidv4() }
    }

    // Track page view
    this.analyticsService.track({
      event: "page_view",
      sessionId: req.session.id,
      userId: req.user?.id,
      timestamp: new Date(),
      properties: {
        path: req.path,
        method: req.method,
        userAgent: req.get("User-Agent"),
      },
      metadata: {
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      },
    })

    next()
  }
}
