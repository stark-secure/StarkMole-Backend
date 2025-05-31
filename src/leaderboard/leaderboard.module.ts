import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './Leaderboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([]), // Add your entities here if needed
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports:[LeaderboardService],
})
export class LeaderboardModule {}
