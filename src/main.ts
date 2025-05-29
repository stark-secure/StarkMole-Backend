import { NestFactory } from "@nestjs/core"
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  app.enableCors()

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Global class serializer interceptor to handle DTOs
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  // Global prefix for all routes
  app.setGlobalPrefix("api/v1")

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
