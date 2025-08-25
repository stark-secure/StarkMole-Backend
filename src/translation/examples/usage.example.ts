import { Controller, Get, Param, UseInterceptors, UseGuards } from "@nestjs/common"
import { type TranslationHelper, TranslationInterceptor, LanguageGuard, type TranslationService } from "../index"

// Example 1: Basic usage in controller
@Controller("example")
export class ExampleController {
  constructor(private readonly translationHelper: TranslationHelper) {}

  @Get("welcome")
  async getWelcomeMessage(language: string) {
    const message = await this.translationHelper.t("common.welcome", language)
    return { message, language }
  }

  @Get("greeting/:name")
  async getPersonalGreeting(language: string, @Param("name") name: string) {
    const greeting = await this.translationHelper.translateWithInterpolation(
      "common.greeting",
      language,
      { name },
      "Hello {{name}}!",
    )
    return { greeting, language }
  }
}

// Example 2: Using interceptor and guards
@Controller("protected")
@UseInterceptors(TranslationInterceptor)
@UseGuards(LanguageGuard)
export class ProtectedController {
  @Get("dashboard")
  async getDashboard(language: string) {
    // Translations are automatically loaded by interceptor
    return {
      title: "Dashboard", // This would be translated automatically
      language,
    }
  }
}

// Example 3: Service usage
export class NotificationService {
  constructor(
    private readonly translationService: TranslationService,
    private readonly translationHelper: TranslationHelper,
  ) {}

  async sendNotification(userId: string, userLanguage: string, notificationType: string) {
    // Get notification template
    const template = await this.translationHelper.t(`notifications.${notificationType}`, userLanguage)

    // Get user-specific translations
    const userTranslations = await this.translationHelper.getNamespaceTranslations("user", userLanguage)

    // Send notification with translated content
    return { template, userTranslations }
  }

  async createBulkTranslations() {
    // Example of bulk translation creation
    const result = await this.translationService.bulkCreateTranslations({
      languageCode: "es",
      translations: [
        {
          key: "notifications.welcome",
          value: "¡Bienvenido a nuestra aplicación!",
          namespace: "notifications",
          description: "Welcome notification message",
        },
        {
          key: "notifications.goodbye",
          value: "¡Gracias por usar nuestra aplicación!",
          namespace: "notifications",
          description: "Goodbye notification message",
        },
      ],
    })

    return result
  }
}

// Example 4: Async module configuration
export class ConfigService {
  getTranslationConfig() {
    return {
      defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
      fallbackLanguage: process.env.FALLBACK_LANGUAGE || "en",
      cacheEnabled: process.env.CACHE_ENABLED === "true",
      cacheTTL: Number.parseInt(process.env.CACHE_TTL) || 300000,
    }
  }
}

// In app.module.ts:
/*
@Module({
  imports: [
    TranslationModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.getTranslationConfig(),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
*/
