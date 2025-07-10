import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { BadgeModule } from '../badge/badge.module';
import { UserModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Game]), BadgeModule, UserModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [TypeOrmModule, GameService],
})
export class GameModule {}
