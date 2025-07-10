export interface SessionType {
  id: string;
  userId: string;
  gameType: string;
  status: 'active' | 'completed' | 'abandoned' | 'under_review' | 'invalid';
  score?: number;
  duration?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSessionData {
  sessionId: string;
  userId: string;
  gameData: any;
  timestamp: Date;
}

export interface SessionValidationResult {
  isValid: boolean;
  violations: string[];
  score: number;
  metadata: Record<string, any>;
}
