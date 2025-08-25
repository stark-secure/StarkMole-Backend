export interface TranslationMap {
  [key: string]: string
}

export interface LanguageTranslations {
  language: {
    code: string
    name: string
    nativeName: string
  }
  translations: TranslationMap
}

export interface TranslationOptions {
  defaultValue?: string
  interpolation?: Record<string, string | number>
}

export interface BulkTranslationResult {
  created: number
  updated: number
  errors: Array<{
    key: string
    error: string
  }>
}
