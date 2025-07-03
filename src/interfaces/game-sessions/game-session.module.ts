import { Module } from "@nestjs/common"
import { GameSessionServiceImpl } from "./game-session.service"
import { GameSessionController } from "./game-session.controller"
import { SessionIntegrityService } from "./session-integrity.service"

@Module({
  providers: [GameSessionServiceImpl, SessionIntegrityService],
  controllers: [GameSessionController],
  exports: [GameSessionServiceImpl, SessionIntegrityService],
})
export class GameSessionModule {}
