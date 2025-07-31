import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { CacheInterceptor } from '../cache/interceptors/cache.interceptor';
import { Cacheable, CacheKeys } from '../cache/decorators/cache.decorator';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('today')
  @UseInterceptors(CacheInterceptor)
  @Cacheable(CacheKeys.TODAY_CHALLENGE, 3600) // 1 hour TTL
  async getTodayChallenge(): Promise<ChallengeResponseDto> {
    return this.challengeService.findTodayChallenge();
  }
}
