/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from '../../common/gateways/realtime.gateway';

interface PendingUpdate {
  leaderboardId: string;
  updateType: 'score_change' | 'rank_change' | 'new_entry' | 'reset';
  timestamp: number;
}

@Injectable()
export class RealtimePerformanceService {
  private readonly logger = new Logger(RealtimePerformanceService.name);
  private pendingUpdates: Map<string, PendingUpdate> = new Map();
  private updateThrottleMs = 1000; // Throttle updates to once per second per leaderboard
  private maxConcurrentUsers = 100;
  private connectedUsersCount = 0;

  constructor(private readonly realtimeGateway: RealtimeGateway) {
    // Process pending updates every second
    setInterval(() => this.processPendingUpdates(), this.updateThrottleMs);
  }

  async throttledEmitLeaderboardUpdate(
    leaderboardId: string,
    scores: any[],
    updateType: 'score_change' | 'rank_change' | 'new_entry' | 'reset' = 'score_change'
  ): Promise<void> {
    const key = `${leaderboardId}:${updateType}`;
    const now = Date.now();

    // Store the most recent update request
    this.pendingUpdates.set(key, {
      leaderboardId,
      updateType,
      timestamp: now
    });

    // If it's a critical update (reset, new_entry), process immediately
    if (updateType === 'reset' || updateType === 'new_entry') {
      await this.realtimeGateway.emitLeaderboardUpdate(leaderboardId, scores, updateType);
      this.pendingUpdates.delete(key);
    }
  }

  private async processPendingUpdates(): Promise<void> {
    const now = Date.now();
    const updates = Array.from(this.pendingUpdates.entries());

    for (const [key, update] of updates) {
      // Only process updates that are older than throttle period
      if (now - update.timestamp >= this.updateThrottleMs) {
        try {
          // Get fresh leaderboard data
          // Note: This would typically call the leaderboard service to get fresh data
          // For now, we'll emit a lightweight update
          await this.realtimeGateway.emitLeaderboardUpdate(
            update.leaderboardId,
            [], // Empty array, clients can fetch fresh data
            update.updateType
          );
          
          this.pendingUpdates.delete(key);
          this.logger.debug(`Processed throttled update for ${update.leaderboardId}`);
        } catch (error) {
          this.logger.error(`Failed to process update for ${update.leaderboardId}:`, error);
        }
      }
    }
  }

  async handleUserConnection(): Promise<void> {
    this.connectedUsersCount++;
    
    // Adjust throttling based on load
    if (this.connectedUsersCount > this.maxConcurrentUsers) {
      this.updateThrottleMs = 2000; // Increase throttle to 2 seconds under high load
      this.logger.warn(`High load detected (${this.connectedUsersCount} users). Increased throttle to ${this.updateThrottleMs}ms`);
    } else {
      this.updateThrottleMs = 1000; // Reset to normal throttle
    }
  }

  async handleUserDisconnection(): Promise<void> {
    this.connectedUsersCount = Math.max(0, this.connectedUsersCount - 1);
    
    // Reset throttling when load decreases
    if (this.connectedUsersCount <= this.maxConcurrentUsers) {
      this.updateThrottleMs = 1000;
    }
  }

  getPerformanceStats(): {
    connectedUsers: number;
    pendingUpdates: number;
    throttleMs: number;
  } {
    return {
      connectedUsers: this.connectedUsersCount,
      pendingUpdates: this.pendingUpdates.size,
      throttleMs: this.updateThrottleMs,
    };
  }

  async clearPendingUpdates(): Promise<void> {
    this.pendingUpdates.clear();
    this.logger.log('Cleared all pending updates');
  }
}
