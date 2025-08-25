import { Injectable } from "@nestjs/common"
import type { TranslationService } from "../services/translation.service"
import type { TranslationOptions } from "../interfaces/translation.interface"

@Injectable()
export class TranslationHelper {
  constructor(private readonly translationService: TranslationService) {}

  async t(key: string, language: string, options?: TranslationOptions): Promise<string> {
    return this.translationService.getTranslation(key, language, options)
  }

  async translate(key: string, language: string, options?: TranslationOptions): Promise<string> {
    return this.translationService.getTranslation(key, language, options)
  }

  async translateWithInterpolation(
    key: string,
    language: string,
    interpolation: Record<string, string | number>,
    defaultValue?: string,
  ): Promise<string> {
    return this.translationService.getTranslation(key, language, {
      interpolation,
      defaultValue,
    })
  }

  async getNamespaceTranslations(namespace: string, language: string): Promise<Record<string, string>> {
    return this.translationService.findTranslationsByNamespace(language, namespace)
  }

  async getAllTranslations(language: string): Promise<Record<string, string>> {
    const result = await this.translationService.findTranslationsByLanguage(language)
    return result.translations
  }

  // Utility method for pluralization (basic implementation)
  async translatePlural(key: string, count: number, language: string, options?: TranslationOptions): Promise<string> {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`
    const translation = await this.translationService.getTranslation(pluralKey, language, options)

    // Replace count placeholder if exists
    return translation.replace(/{{count}}/g, count.toString())
  }
}
