// Main module
export { TranslationModule } from "./translation.module"

// Entities
export { Language, Translation } from "./entities"

// Services
export { TranslationService } from "./services/translation.service"

// Controllers
export { TranslationController, LanguageController } from "./controllers"

// DTOs
export {
  CreateLanguageDto,
  UpdateLanguageDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  BulkTranslationDto,
  BulkTranslationItem,
} from "./dto"

// Interfaces
export {
  TranslationMap,
  LanguageTranslations,
  TranslationOptions,
  BulkTranslationResult,
} from "./interfaces/translation.interface"

export {
  TranslationModuleOptions,
  TranslationModuleAsyncOptions,
  TranslationModuleOptionsFactory,
} from "./interfaces/translation-module-options.interface"

// Decorators
export { Language, Translate, TranslationKey, TranslationNamespace } from "./decorators"

// Utils
export { TranslationHelper } from "./utils"

// Interceptors
export { TranslationInterceptor } from "./interceptors"

// Guards
export { LanguageGuard } from "./guards"

// Pipes
export { LanguageValidationPipe } from "./pipes"

// Middleware
export { LanguageMiddleware } from "./middleware"
