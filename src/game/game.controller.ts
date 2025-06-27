import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { GameService } from './game.service';

@Controller('games')
@UseGuards(AuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createGame(
    gameData: { score: number; gameData?: any },
    @Request() req,
  ) {
    return await this.gameService.createGame(
      req.user.id,
      gameData.score,
      gameData.gameData,
    );
  }

  @Get('user/:userId')
  async getUserGames(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.gameService.getUserGames(userId);
  }

  @Get('user/:userId/stats')
  async getGameStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.gameService.getGameStats(userId);
  }
}
