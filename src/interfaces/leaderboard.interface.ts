export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  gamesPlayed: number;
  winRate: number;
  lastActive: Date;
  country?: string;
  region?: string;
  lastActiveAt?: Date;
  displayName?: string;
  totalPuzzlesCompleted?: number;
  totalModulesCompleted?: number;
  completionPercentage?: number;
}

export interface LeaderboardFilters {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  gameType?: string;
  region?: string;
  minGames?: number;
}

export interface PaginatedLeaderboardQuery {
  page: number;
  limit: number;
  filters?: LeaderboardFilters;
  type?: string;
  country?: string;
  region?: string;
  timeframe?: string;
  challengeType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions extends LeaderboardFilters {}

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
