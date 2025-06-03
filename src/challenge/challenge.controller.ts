import { Controller, Get } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeResponseDto } from './dto/challenge-response.dto';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('today')
  async getTodayChallenge(): Promise<ChallengeResponseDto> {
    return this.challengeService.findTodayChallenge();
  }
}
