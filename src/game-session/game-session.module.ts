import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSessionController } from './game-session.controller';
import { GameSessionService } from './game-session.service';
import { GameSession } from './entities/game-session.entity';
import { InputEvent } from './entities/input-event.entity';
import { SessionIntegrityGuard } from '../common/guards/session-integrity.guard';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession, InputEvent])],
  controllers: [GameSessionController],
  providers: [GameSessionService, SessionIntegrityGuard],
  exports: [GameSessionService],
})
export class GameSessionModule {}
