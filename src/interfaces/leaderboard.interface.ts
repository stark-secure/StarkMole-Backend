export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  gamesPlayed: number;
  winRate: number;
  lastActive: Date;
}

export interface LeaderboardFilters {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  gameType?: string;
  region?: string;
  minGames?: number;
}

export interface PaginatedLeaderboard {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeaderboardStats {
  totalPlayers: number;
  averageScore: number;
  topScore: number;
  lastUpdated: Date;
}
