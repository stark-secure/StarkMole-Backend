import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import axios, { type AxiosInstance } from "axios"
import type { AnalyticsEvent, AnalyticsProvider } from "../interfaces/analytics.interface"

@Injectable()
export class GoogleAnalyticsProvider implements AnalyticsProvider {
  private readonly logger = new Logger(GoogleAnalyticsProvider.name)
  private client: AxiosInstance | null = null
  private measurementId: string
  private apiSecret: string

  constructor(private configService: ConfigService) {
    this.initialize()
  }

  private initialize(): void {
    this.measurementId = this.configService.get<string>("GA_MEASUREMENT_ID")
    this.apiSecret = this.configService.get<string>("GA_API_SECRET")

    if (this.measurementId && this.apiSecret) {
      this.client = axios.create({
        baseURL: "https://www.google-analytics.com",
        headers: {
          "Content-Type": "application/json",
        },
      })
      this.logger.log("Google Analytics provider initialized")
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.client || !this.measurementId || !this.apiSecret) {
      return
    }

    try {
      await this.client.post(`/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`, {
        client_id: event.userId || event.sessionId,
        events: [
          {
            name: event.event,
            parameters: {
              ...event.properties,
              session_id: event.sessionId,
              user_id: event.userId,
            },
          },
        ],
      })
    } catch (error) {
      this.logger.error(`Google Analytics tracking error: ${error.message}`)
      throw error
    }
  }

  async identify(userId: string, properties: Record<string, any>): Promise<void> {
    if (!this.client || !this.measurementId || !this.apiSecret) {
      return
    }

    try {
      await this.client.post(`/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`, {
        client_id: userId,
        user_properties: properties,
        events: [
          {
            name: "user_identified",
            parameters: {
              user_id: userId,
            },
          },
        ],
      })
    } catch (error) {
      this.logger.error(`Google Analytics identify error: ${error.message}`)
      throw error
    }
  }

  async flush(): Promise<void> {
    // Google Analytics sends events immediately via HTTP
    return Promise.resolve()
  }
}
