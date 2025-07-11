import { Module } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { TypedConfigService } from '../common/config/typed-config.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge]),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: TypedConfigService) => ({
        store: redisStore,
        host: configService.redisHost,
        port: configService.redisPort,
        ttl: 86400, // 24 hours
      }),
      inject: [TypedConfigService],
    }),
    AnalyticsModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService, TypedConfigService],
})
export class ChallengeModule {}
