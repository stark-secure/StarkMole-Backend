import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract and normalize language from various sources
    let language = "en" // default

    // Priority order: query param > custom header > accept-language header
    if (req.query.lang && typeof req.query.lang === "string") {
      language = req.query.lang.toLowerCase()
    } else if (req.headers["x-language"]) {
      language = (req.headers["x-language"] as string).toLowerCase()
    } else if (req.headers["accept-language"]) {
      const acceptLanguage = req.headers["accept-language"] as string
      language = acceptLanguage.split(",")[0].split("-")[0].toLowerCase()
    }

    // Attach language to request object
    req.language = language

    // Set response header for client reference
    res.setHeader("Content-Language", language)

    next()
  }
}
