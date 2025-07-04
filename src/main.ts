import { NestFactory } from "@nestjs/core"
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AppModule } from "./app.module"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { TypedConfigService } from './common/config/typed-config.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(TypedConfigService);

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
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
 // Swagger configuration - only in non-production environments
  if (configService.nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('StarkMole-Backend API') 
    .setDescription('API documentation for StarkMole-Backend, supporting the on-chain game built on StarkNet')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        }, 
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // This will remember your token when you refresh the page
      },
    });
  }
   

  // Global class serializer interceptor to handle DTOs
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  // Global prefix for all routes
  app.setGlobalPrefix("api/v1")

  // Serve static files from /uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')))

  await app.listen(configService.port)
}
bootstrap()
