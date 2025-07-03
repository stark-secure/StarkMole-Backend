export interface GameSession {
  id: string
  userId: string
  puzzleId?: string
  moduleId?: string
  sessionType: SessionType
  status: SessionStatus
  startedAt: Date
  endedAt?: Date
  duration?: number // in milliseconds
  score?: number
  maxPossibleScore?: number
  actions: GameAction[]
  metadata: SessionMetadata
  signature?: string
  integrityChecks: IntegrityCheckResult[]
  createdAt: Date
  updatedAt: Date
}

export interface GameAction {
  id: string
  type: ActionType
  timestamp: Date
  data: Record<string, any>
  sequence: number
  clientTimestamp?: Date
  serverTimestamp: Date
}

export interface SessionMetadata {
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string
  clientVersion?: string
  sessionToken?: string
  difficulty?: string
  hints?: number
  attempts?: number
  pauseCount?: number
  totalPauseTime?: number
  screenResolution?: string
  timezone?: string
}

export interface IntegrityCheckResult {
  checkType: IntegrityCheckType
  status: "passed" | "failed" | "warning"
  message: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: Date
  details?: Record<string, any>
}

export interface SessionValidationRules {
  minDuration: number // milliseconds
  maxDuration: number // milliseconds
  maxScore: number
  minScore: number
  maxActionsPerSecond: number
  requiredActions: ActionType[]
  maxHints: number
  maxAttempts: number
  scoreThresholds: {
    suspicious: number // Score that triggers review
    impossible: number // Score that's physically impossible
  }
  timeThresholds: {
    tooFast: number // Completion time that's suspiciously fast
    tooSlow: number // Completion time that's suspiciously slow
  }
}

export interface AnomalyDetectionConfig {
  enableScoreValidation: boolean
  enableTimeValidation: boolean
  enableActionValidation: boolean
  enableReplayDetection: boolean
  enableRateLimiting: boolean
  logLevel: "none" | "warnings" | "all"
  autoReject: boolean
  moderationThreshold: number // Number of violations before flagging
}

export interface SessionAnomalyLog {
  id: string
  sessionId: string
  userId: string
  anomalyType: AnomalyType
  severity: "low" | "medium" | "high" | "critical"
  description: string
  detectedAt: Date
  metadata: Record<string, any>
  resolved: boolean
  moderatorNotes?: string
}

export interface SessionIntegrityReport {
  sessionId: string
  overallStatus: "valid" | "suspicious" | "invalid"
  confidenceScore: number // 0-100
  checks: IntegrityCheckResult[]
  anomalies: SessionAnomalyLog[]
  recommendation: "accept" | "review" | "reject"
  riskScore: number // 0-100
}

export type SessionType = "puzzle" | "module" | "challenge" | "practice" | "tournament"

export type SessionStatus = "active" | "completed" | "abandoned" | "paused" | "invalid" | "under_review"

export type ActionType =
  | "start"
  | "move"
  | "hint_request"
  | "pause"
  | "resume"
  | "submit_answer"
  | "complete"
  | "abandon"
  | "heartbeat"

export type IntegrityCheckType =
  | "score_validation"
  | "time_validation"
  | "action_sequence"
  | "replay_detection"
  | "rate_limiting"
  | "signature_verification"
  | "metadata_validation"

export type AnomalyType =
  | "impossible_score"
  | "suspicious_time"
  | "invalid_sequence"
  | "replay_attack"
  | "rate_limit_exceeded"
  | "tampered_data"
  | "missing_actions"
  | "inconsistent_metadata"

export interface GameSessionService {
  // Session management
  startSession(userId: string, sessionType: SessionType, puzzleId?: string, moduleId?: string): Promise<GameSession>
  endSession(sessionId: string, finalData: Partial<GameSession>): Promise<SessionIntegrityReport>
  pauseSession(sessionId: string): Promise<GameSession>
  resumeSession(sessionId: string): Promise<GameSession>
  abandonSession(sessionId: string): Promise<GameSession>

  // Action tracking
  recordAction(sessionId: string, action: Omit<GameAction, "id" | "serverTimestamp">): Promise<GameAction>
  validateAction(sessionId: string, action: GameAction): Promise<boolean>

  // Integrity validation
  validateSession(session: GameSession): Promise<SessionIntegrityReport>
  detectAnomalies(session: GameSession): Promise<SessionAnomalyLog[]>

  // Session retrieval
  getSession(sessionId: string): Promise<GameSession | null>
  getUserSessions(userId: string, limit?: number): Promise<GameSession[]>

  // Anomaly management
  getAnomalies(sessionId?: string, userId?: string): Promise<SessionAnomalyLog[]>
  resolveAnomaly(anomalyId: string, moderatorNotes: string): Promise<void>
}
