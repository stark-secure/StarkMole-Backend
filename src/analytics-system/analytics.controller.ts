import { Controller, Post } from "@nestjs/common"
import type { AnalyticsService } from "./analytics.service"
import type { AnalyticsEvent } from "./interfaces/analytics.interface"

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("track")
  async trackEvent(event: AnalyticsEvent): Promise<{ success: boolean }> {
    await this.analyticsService.track(event)
    return { success: true }
  }

  @Post("identify")
  async identifyUser(body: { userId: string; properties: Record<string, any> }): Promise<{ success: boolean }> {
    await this.analyticsService.identify(body.userId, body.properties)
    return { success: true }
  }

  @Post("session/start")
  async trackSessionStart(body: { sessionId: string; userId?: string }): Promise<{ success: boolean }> {
    await this.analyticsService.trackSessionStart(body.sessionId, body.userId)
    return { success: true }
  }

  @Post("game/start")
  async trackGameStart(body: { gameId: string; gameType: string; sessionId: string; userId?: string }): Promise<{
    success: boolean
  }> {
    await this.analyticsService.trackGameStart(body.gameId, body.gameType, body.sessionId, body.userId)
    return { success: true }
  }

  @Post("reward/claim")
  async trackRewardClaim(body: {
    rewardId: string
    rewardType: string
    rewardValue: number
    source: string
    sessionId: string
    userId?: string
  }): Promise<{ success: boolean }> {
    await this.analyticsService.trackRewardClaim(
      body.rewardId,
      body.rewardType,
      body.rewardValue,
      body.source,
      body.sessionId,
      body.userId,
    )
    return { success: true }
  }

  @Post("interaction/button")
  async trackButtonClick(body: { elementId: string; page: string; sessionId: string; userId?: string }): Promise<{
    success: boolean
  }> {
    await this.analyticsService.trackButtonClick(body.elementId, body.page, body.sessionId, body.userId)
    return { success: true }
  }
}
