import type { ModuleMetadata, Type } from "@nestjs/common"

export interface TranslationModuleOptions {
  defaultLanguage?: string
  fallbackLanguage?: string
  cacheEnabled?: boolean
  cacheTTL?: number // in milliseconds
  autoLoadTranslations?: boolean
  supportedLanguages?: string[]
}

export interface TranslationModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useExisting?: Type<TranslationModuleOptionsFactory>
  useClass?: Type<TranslationModuleOptionsFactory>
  useFactory?: (...args: any[]) => Promise<TranslationModuleOptions> | TranslationModuleOptions
  inject?: any[]
}

export interface TranslationModuleOptionsFactory {
  createTranslationOptions(): Promise<TranslationModuleOptions> | TranslationModuleOptions
}
