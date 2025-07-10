export interface GameSessionStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  highestScore: number;
  totalTimePlayed: number;
  averageSessionDuration: number;
  winRate: number;
  lastPlayedAt?: Date;
}

export interface GameSessionSummary {
  sessionId: string;
  userId: string;
  score: number;
  duration: number;
  status: string;
  createdAt: Date;
  completedAt?: Date;
}
