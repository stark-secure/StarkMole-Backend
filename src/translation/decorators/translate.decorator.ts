import { createParamDecorator, type ExecutionContext } from "@nestjs/common"
import type { Request } from "express"

export const Language = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>()

  // Try to get language from various sources in order of priority
  // 1. Query parameter
  if (request.query.lang && typeof request.query.lang === "string") {
    return request.query.lang
  }

  // 2. Header
  if (request.headers["accept-language"]) {
    const acceptLanguage = request.headers["accept-language"] as string
    const primaryLanguage = acceptLanguage.split(",")[0].split("-")[0]
    return primaryLanguage
  }

  // 3. Custom header
  if (request.headers["x-language"]) {
    return request.headers["x-language"] as string
  }

  // 4. Default to English
  return "en"
})

export const Translate = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>()
  const language = request.language || "en"

  // This will be populated by the TranslationInterceptor
  const translations = request.translations || {}

  return translations[key] || key
})
