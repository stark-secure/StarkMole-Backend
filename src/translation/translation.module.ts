import { Module, type DynamicModule, Global } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Language, Translation } from "./entities"
import { TranslationService } from "./services/translation.service"
import { TranslationController, LanguageController } from "./controllers"
import { TranslationHelper } from "./utils"
import { TranslationInterceptor } from "./interceptors"
import { LanguageGuard } from "./guards"
import { LanguageValidationPipe } from "./pipes"
import { LanguageMiddleware } from "./middleware"
import type {
  TranslationModuleOptions,
  TranslationModuleAsyncOptions,
  TranslationModuleOptionsFactory,
} from "./interfaces/translation-module-options.interface"

@Global()
@Module({})
export class TranslationModule {
  static forRoot(options?: TranslationModuleOptions): DynamicModule {
    return {
      module: TranslationModule,
      imports: [TypeOrmModule.forFeature([Language, Translation])],
      controllers: [TranslationController, LanguageController],
      providers: [
        TranslationService,
        TranslationHelper,
        TranslationInterceptor,
        LanguageGuard,
        LanguageValidationPipe,
        LanguageMiddleware,
        {
          provide: "TRANSLATION_MODULE_OPTIONS",
          useValue: options || {},
        },
      ],
      exports: [
        TranslationService,
        TranslationHelper,
        TranslationInterceptor,
        LanguageGuard,
        LanguageValidationPipe,
        LanguageMiddleware,
        TypeOrmModule,
      ],
    }
  }

  static forRootAsync(options: TranslationModuleAsyncOptions): DynamicModule {
    return {
      module: TranslationModule,
      imports: [TypeOrmModule.forFeature([Language, Translation]), ...(options.imports || [])],
      controllers: [TranslationController, LanguageController],
      providers: [
        ...this.createAsyncProviders(options),
        TranslationService,
        TranslationHelper,
        TranslationInterceptor,
        LanguageGuard,
        LanguageValidationPipe,
        LanguageMiddleware,
      ],
      exports: [
        TranslationService,
        TranslationHelper,
        TranslationInterceptor,
        LanguageGuard,
        LanguageValidationPipe,
        LanguageMiddleware,
        TypeOrmModule,
      ],
    }
  }

  private static createAsyncProviders(options: TranslationModuleAsyncOptions): any[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(options: TranslationModuleAsyncOptions): any {
    if (options.useFactory) {
      return {
        provide: "TRANSLATION_MODULE_OPTIONS",
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: "TRANSLATION_MODULE_OPTIONS",
      useFactory: async (optionsFactory: TranslationModuleOptionsFactory) =>
        await optionsFactory.createTranslationOptions(),
      inject: [options.useExisting || options.useClass],
    }
  }
}
