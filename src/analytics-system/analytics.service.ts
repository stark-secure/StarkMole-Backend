import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type {
  AnalyticsEvent,
  AnalyticsProvider,
  SessionEvent,
  GameEvent,
  RewardEvent,
  LeaderboardEvent,
  InteractionEvent,
} from "./interfaces/analytics.interface"
import type { PostHogProvider } from "./providers/posthog.provider"
import type { MixpanelProvider } from "./providers/mixpanel.provider"
import type { PlausibleProvider } from "./providers/plausible.provider"
import type { GoogleAnalyticsProvider } from "./providers/google-analytics.provider"
import { AnalyticsEvents } from "./enums/analytics-events.enum"

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private providers: AnalyticsProvider[] = []
  private isEnabled: boolean

  constructor(
    private configService: ConfigService,
    private postHogProvider: PostHogProvider,
    private mixpanelProvider: MixpanelProvider,
    private plausibleProvider: PlausibleProvider,
    private googleAnalyticsProvider: GoogleAnalyticsProvider,
  ) {
    this.isEnabled = this.configService.get<boolean>("ANALYTICS_ENABLED", true)
    this.initializeProviders()
  }

  private initializeProviders(): void {
    if (!this.isEnabled) {
      this.logger.warn("Analytics is disabled")
      return
    }

    // Initialize enabled providers based on configuration
    if (this.configService.get("POSTHOG_API_KEY")) {
      this.providers.push(this.postHogProvider)
    }

    if (this.configService.get("MIXPANEL_TOKEN")) {
      this.providers.push(this.mixpanelProvider)
    }

    if (this.configService.get("PLAUSIBLE_DOMAIN")) {
      this.providers.push(this.plausibleProvider)
    }

    if (this.configService.get("GA_MEASUREMENT_ID")) {
      this.providers.push(this.googleAnalyticsProvider)
    }

    this.logger.log(`Initialized ${this.providers.length} analytics providers`)
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled || this.providers.length === 0) {
      return
    }

    // Sanitize event to remove PII
    const sanitizedEvent = this.sanitizeEvent(event)

    // Track with all providers
    const promises = this.providers.map((provider) =>
      provider.track(sanitizedEvent).catch((error) => {
        this.logger.error(`Failed to track event with provider: ${error.message}`)
      }),
    )

    await Promise.allSettled(promises)
    this.logger.debug(`Tracked event: ${event.event}`)
  }

  async trackSession(event: SessionEvent): Promise<void> {
    await this.track(event)
  }

  async trackGame(event: GameEvent): Promise<void> {
    await this.track(event)
  }

  async trackReward(event: RewardEvent): Promise<void> {
    await this.track(event)
  }

  async trackLeaderboard(event: LeaderboardEvent): Promise<void> {
    await this.track(event)
  }

  async trackInteraction(event: InteractionEvent): Promise<void> {
    await this.track(event)
  }

  async identify(userId: string, properties: Record<string, any>): Promise<void> {
    if (!this.isEnabled || this.providers.length === 0) {
      return
    }

    // Sanitize properties to remove PII
    const sanitizedProperties = this.sanitizeProperties(properties)

    const promises = this.providers.map((provider) =>
      provider.identify(userId, sanitizedProperties).catch((error) => {
        this.logger.error(`Failed to identify user with provider: ${error.message}`)
      }),
    )

    await Promise.allSettled(promises)
  }

  async flush(): Promise<void> {
    if (!this.isEnabled || this.providers.length === 0) {
      return
    }

    const promises = this.providers.map((provider) =>
      provider.flush().catch((error) => {
        this.logger.error(`Failed to flush provider: ${error.message}`)
      }),
    )

    await Promise.allSettled(promises)
  }

  private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    const sanitized = { ...event }

    // Remove potential PII from properties
    sanitized.properties = this.sanitizeProperties(event.properties)

    // Remove IP address and other sensitive metadata
    if (sanitized.metadata) {
      delete sanitized.metadata.ip
      // Keep only non-PII metadata
      sanitized.metadata = {
        device: sanitized.metadata.device,
        browser: sanitized.metadata.browser,
        country: sanitized.metadata.country,
      }
    }

    return sanitized
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties }

    // List of keys that might contain PII
    const piiKeys = ["email", "name", "firstName", "lastName", "phone", "address", "ip"]

    piiKeys.forEach((key) => {
      delete sanitized[key]
    })

    return sanitized
  }

  // Convenience methods for common events
  async trackSessionStart(sessionId: string, userId?: string): Promise<void> {
    await this.trackSession({
      event: AnalyticsEvents.SESSION_START,
      sessionId,
      userId,
      timestamp: new Date(),
      properties: {},
    })
  }

  async trackGameStart(gameId: string, gameType: string, sessionId: string, userId?: string): Promise<void> {
    await this.trackGame({
      event: AnalyticsEvents.GAME_START,
      sessionId,
      userId,
      timestamp: new Date(),
      properties: {
        gameId,
        gameType,
      },
    })
  }

  async trackRewardClaim(
    rewardId: string,
    rewardType: string,
    rewardValue: number,
    source: string,
    sessionId: string,
    userId?: string,
  ): Promise<void> {
    await this.trackReward({
      event: AnalyticsEvents.REWARD_CLAIM,
      sessionId,
      userId,
      timestamp: new Date(),
      properties: {
        rewardId,
        rewardType,
        rewardValue,
        source,
      },
    })
  }

  async trackButtonClick(elementId: string, page: string, sessionId: string, userId?: string): Promise<void> {
    await this.trackInteraction({
      event: AnalyticsEvents.BUTTON_CLICK,
      sessionId,
      userId,
      timestamp: new Date(),
      properties: {
        elementId,
        elementType: "button",
        page,
      },
    })
  }
}
