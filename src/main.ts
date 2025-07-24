import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TypedConfigService } from './common/config/typed-config.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import * as express from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    }),
  });
  const configService = app.get(TypedConfigService);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Prometheus metrics endpoint
  app.use('/metrics', app.get(PrometheusController));

  // Swagger configuration - only in non-production environments
  if (configService.nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Stark Insured API')
      .setDescription(
        'Comprehensive API documentation for the Stark Insured backend',
      )
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
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // This will remember your token when you refresh the page
      },
    });
  }

  // Global class serializer interceptor to handle DTOs
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Serve static files from /uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(configService.port);
}
bootstrap();
