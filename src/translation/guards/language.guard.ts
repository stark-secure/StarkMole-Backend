import { Injectable, type CanActivate, type ExecutionContext, BadRequestException } from "@nestjs/common"
import type { Request } from "express"
import type { TranslationService } from "../services/translation.service"

@Injectable()
export class LanguageGuard implements CanActivate {
  constructor(private readonly translationService: TranslationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    // Extract language from request
    const language = this.extractLanguage(request)

    try {
      // Validate that the language exists and is active
      await this.translationService.findLanguageByCode(language)
      return true
    } catch (error) {
      throw new BadRequestException(`Unsupported language: ${language}`)
    }
  }

  private extractLanguage(request: Request): string {
    if (request.query.lang && typeof request.query.lang === "string") {
      return request.query.lang
    }

    if (request.headers["x-language"]) {
      return request.headers["x-language"] as string
    }

    if (request.headers["accept-language"]) {
      const acceptLanguage = request.headers["accept-language"] as string
      const primaryLanguage = acceptLanguage.split(",")[0].split("-")[0]
      return primaryLanguage
    }

    return "en"
  }
}
