
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggingMiddleware } from './common/middleware/logging.middleware';






import { ScheduleModule } from "@nestjs/schedule"; 


import { LeaderboardModule } from './leaderboard/leaderboard.module';

import { GameSessionModule } from './game-session/game-session.module';
import { ChallengeModule } from './challenge/challenge.module';
import { MailModule } from './mail/mail.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,

     

        synchronize: true, // ⚠️ Set to false in production

      }),
    }),

    ScheduleModule.forRoot(), 

    UserModule,
    AuthModule,
    LeaderboardModule,
    AnalyticsModule,
    GameSessionModule,
    ChallengeModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply globally
  }
}
