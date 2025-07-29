import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AnalyticsService } from "./analytics.service"
import { AnalyticsController } from "./analytics.controller"
import { PostHogProvider } from "./providers/posthog.provider"
import { MixpanelProvider } from "./providers/mixpanel.provider"
import { PlausibleProvider } from "./providers/plausible.provider"
import { GoogleAnalyticsProvider } from "./providers/google-analytics.provider"
import { AnalyticsInterceptor } from "./interceptors/analytics.interceptor"

@Module({
  imports: [ConfigModule],
  providers: [
    AnalyticsService,
    PostHogProvider,
    MixpanelProvider,
    PlausibleProvider,
    GoogleAnalyticsProvider,
    AnalyticsInterceptor,
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
