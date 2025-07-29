import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import axios, { type AxiosInstance } from "axios"
import type { AnalyticsEvent, AnalyticsProvider } from "../interfaces/analytics.interface"

@Injectable()
export class PlausibleProvider implements AnalyticsProvider {
  private readonly logger = new Logger(PlausibleProvider.name)
  private client: AxiosInstance | null = null
  private domain: string

  constructor(private configService: ConfigService) {
    this.initialize()
  }

  private initialize(): void {
    this.domain = this.configService.get<string>("PLAUSIBLE_DOMAIN")
    const apiHost = this.configService.get<string>("PLAUSIBLE_API_HOST", "https://plausible.io")

    if (this.domain) {
      this.client = axios.create({
        baseURL: `${apiHost}/api`,
        headers: {
          "Content-Type": "application/json",
        },
      })
      this.logger.log("Plausible provider initialized")
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.client || !this.domain) {
      return
    }

    try {
      await this.client.post("/event", {
        domain: this.domain,
        name: event.event,
        url: `https://${this.domain}/analytics-event`,
        props: {
          ...event.properties,
          sessionId: event.sessionId,
          userId: event.userId,
        },
      })
    } catch (error) {
      this.logger.error(`Plausible tracking error: ${error.message}`)
      throw error
    }
  }

  async identify(userId: string, properties: Record<string, any>): Promise<void> {
    // Plausible doesn't have user identification in the same way
    // We can track a custom event instead
    if (!this.client || !this.domain) {
      return
    }

    try {
      await this.client.post("/event", {
        domain: this.domain,
        name: "user_identified",
        url: `https://${this.domain}/user-identified`,
        props: {
          userId,
          ...properties,
        },
      })
    } catch (error) {
      this.logger.error(`Plausible identify error: ${error.message}`)
      throw error
    }
  }

  async flush(): Promise<void> {
    // Plausible sends events immediately via HTTP
    return Promise.resolve()
  }
}
