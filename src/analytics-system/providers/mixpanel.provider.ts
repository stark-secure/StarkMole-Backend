import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import Mixpanel from "mixpanel"
import type { AnalyticsEvent, AnalyticsProvider } from "../interfaces/analytics.interface"

@Injectable()
export class MixpanelProvider implements AnalyticsProvider {
  private readonly logger = new Logger(MixpanelProvider.name)
  private client: Mixpanel.Mixpanel | null = null

  constructor(private configService: ConfigService) {
    this.initialize()
  }

  private initialize(): void {
    const token = this.configService.get<string>("MIXPANEL_TOKEN")

    if (token) {
      this.client = Mixpanel.init(token, {
        host: "api-eu.mixpanel.com", // Use EU endpoint for GDPR compliance
      })
      this.logger.log("Mixpanel provider initialized")
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.client) {
      return
    }

    return new Promise((resolve, reject) => {
      this.client!.track(
        event.event,
        {
          distinct_id: event.userId || event.sessionId,
          ...event.properties,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          ...event.metadata,
        },
        (error) => {
          if (error) {
            this.logger.error(`Mixpanel tracking error: ${error.message}`)
            reject(error)
          } else {
            resolve()
          }
        },
      )
    })
  }

  async identify(userId: string, properties: Record<string, any>): Promise<void> {
    if (!this.client) {
      return
    }

    return new Promise((resolve, reject) => {
      this.client!.people.set(userId, properties, (error) => {
        if (error) {
          this.logger.error(`Mixpanel identify error: ${error.message}`)
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  async flush(): Promise<void> {
    // Mixpanel Node.js SDK doesn't have a flush method
    // Events are sent immediately
    return Promise.resolve()
  }
}
