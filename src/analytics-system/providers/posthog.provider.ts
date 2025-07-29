import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { PostHog } from "posthog-node"
import type { AnalyticsEvent, AnalyticsProvider } from "../interfaces/analytics.interface"

@Injectable()
export class PostHogProvider implements AnalyticsProvider {
  private readonly logger = new Logger(PostHogProvider.name)
  private client: PostHog | null = null

  constructor(private configService: ConfigService) {
    this.initialize()
  }

  private initialize(): void {
    const apiKey = this.configService.get<string>("POSTHOG_API_KEY")
    const host = this.configService.get<string>("POSTHOG_HOST", "https://app.posthog.com")

    if (apiKey) {
      this.client = new PostHog(apiKey, {
        host,
        flushAt: 20,
        flushInterval: 10000,
      })
      this.logger.log("PostHog provider initialized")
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      this.client.capture({
        distinctId: event.userId || event.sessionId,
        event: event.event,
        properties: {
          ...event.properties,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          ...event.metadata,
        },
      })
    } catch (error) {
      this.logger.error(`PostHog tracking error: ${error.message}`)
      throw error
    }
  }

  async identify(userId: string, properties: Record<string, any>): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      this.client.identify({
        distinctId: userId,
        properties,
      })
    } catch (error) {
      this.logger.error(`PostHog identify error: ${error.message}`)
      throw error
    }
  }

  async flush(): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      await this.client.flush()
    } catch (error) {
      this.logger.error(`PostHog flush error: ${error.message}`)
      throw error
    }
  }
}
