import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common"
import type { SessionIntegrityService } from "./session-integrity.service"
import type {
  GameSession,
  GameAction,
  SessionType,
  SessionIntegrityReport,
  SessionAnomalyLog,
  GameSessionService,
} from "../interfaces/game-session.interface"

@Injectable()
export class GameSessionServiceImpl implements GameSessionService {
  private readonly logger = new Logger(GameSessionServiceImpl.name)

  // In-memory storage for demo purposes
  private sessions: Map<string, GameSession> = new Map()
  private userSessions: Map<string, string[]> = new Map() // userId -> sessionIds

  constructor(private readonly integrityService: SessionIntegrityService) {}

  async startSession(
    userId: string,
    sessionType: SessionType,
    puzzleId?: string,
    moduleId?: string,
  ): Promise<GameSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const session: GameSession = {
      id: sessionId,
      userId,
      puzzleId,
      moduleId,
      sessionType,
      status: "active",
      startedAt: now,
      actions: [],
      metadata: {
        sessionToken: this.generateSessionToken(sessionId, userId),
      },
      integrityChecks: [],
      createdAt: now,
      updatedAt: now,
    }

    // Generate session signature
    session.signature = this.integrityService.generateSessionSignature(session)

    // Record start action
    const startAction: Omit<GameAction, "id" | "serverTimestamp"> = {
      type: "start",
      timestamp: now,
      data: { sessionType, puzzleId, moduleId },
      sequence: 1,
      clientTimestamp: now,
    }

    await this.recordAction(sessionId, startAction)

    // Store session
    this.sessions.set(sessionId, session)

    // Track user sessions
    const userSessionIds = this.userSessions.get(userId) || []
    userSessionIds.push(sessionId)
    this.userSessions.set(userId, userSessionIds)

    this.logger.log(`Started session ${sessionId} for user ${userId}`)

    return session
  }

  async endSession(sessionId: string, finalData: Partial<GameSession>): Promise<SessionIntegrityReport> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    if (session.status !== "active" && session.status !== "paused") {
      throw new BadRequestException(`Cannot end session with status: ${session.status}`)
    }

    const now = new Date()

    // Update session with final data
    session.endedAt = now
    session.duration = now.getTime() - session.startedAt.getTime()
    session.score = finalData.score ?? session.score
    session.status = "completed"
    session.updatedAt = now

    // Merge additional metadata
    if (finalData.metadata) {
      session.metadata = { ...session.metadata, ...finalData.metadata }
    }

    // Record completion action
    const completeAction: Omit<GameAction, "id" | "serverTimestamp"> = {
      type: "complete",
      timestamp: now,
      data: {
        finalScore: session.score,
        duration: session.duration,
        ...finalData,
      },
      sequence: (session.actions?.length || 0) + 1,
      clientTimestamp: finalData.metadata?.clientTimestamp || now,
    }

    await this.recordAction(sessionId, completeAction)

    // Regenerate signature with final data
    session.signature = this.integrityService.generateSessionSignature(session)

    // Validate session integrity
    const integrityReport = await this.integrityService.validateSession(session)

    // Update session status based on integrity check
    if (integrityReport.recommendation === "reject") {
      session.status = "invalid"
    } else if (integrityReport.recommendation === "review") {
      session.status = "under_review"
    }

    // Store integrity checks in session
    session.integrityChecks = integrityReport.checks

    this.sessions.set(sessionId, session)

    this.logger.log(
      `Ended session ${sessionId} with status: ${integrityReport.overallStatus} (confidence: ${integrityReport.confidenceScore}%)`,
    )

    return integrityReport
  }

  async pauseSession(sessionId: string): Promise<GameSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    if (session.status !== "active") {
      throw new BadRequestException(`Cannot pause session with status: ${session.status}`)
    }

    const now = new Date()
    session.status = "paused"
    session.updatedAt = now

    // Record pause action
    const pauseAction: Omit<GameAction, "id" | "serverTimestamp"> = {
      type: "pause",
      timestamp: now,
      data: {},
      sequence: (session.actions?.length || 0) + 1,
      clientTimestamp: now,
    }

    await this.recordAction(sessionId, pauseAction)

    // Update pause metadata
    session.metadata.pauseCount = (session.metadata.pauseCount || 0) + 1

    this.sessions.set(sessionId, session)
    this.logger.log(`Paused session ${sessionId}`)

    return session
  }

  async resumeSession(sessionId: string): Promise<GameSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    if (session.status !== "paused") {
      throw new BadRequestException(`Cannot resume session with status: ${session.status}`)
    }

    const now = new Date()
    session.status = "active"
    session.updatedAt = now

    // Record resume action
    const resumeAction: Omit<GameAction, "id" | "serverTimestamp"> = {
      type: "resume",
      timestamp: now,
      data: {},
      sequence: (session.actions?.length || 0) + 1,
      clientTimestamp: now,
    }

    await this.recordAction(sessionId, resumeAction)

    this.sessions.set(sessionId, session)
    this.logger.log(`Resumed session ${sessionId}`)

    return session
  }

  async abandonSession(sessionId: string): Promise<GameSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    const now = new Date()
    session.status = "abandoned"
    session.endedAt = now
    session.duration = now.getTime() - session.startedAt.getTime()
    session.updatedAt = now

    // Record abandon action
    const abandonAction: Omit<GameAction, "id" | "serverTimestamp"> = {
      type: "abandon",
      timestamp: now,
      data: { reason: "user_abandoned" },
      sequence: (session.actions?.length || 0) + 1,
      clientTimestamp: now,
    }

    await this.recordAction(sessionId, abandonAction)

    this.sessions.set(sessionId, session)
    this.logger.log(`Abandoned session ${sessionId}`)

    return session
  }

  async recordAction(sessionId: string, actionData: Omit<GameAction, "id" | "serverTimestamp">): Promise<GameAction> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    const action: GameAction = {
      ...actionData,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverTimestamp: new Date(),
    }

    // Validate action before recording
    const isValid = await this.validateAction(sessionId, action)
    if (!isValid) {
      throw new BadRequestException(`Invalid action: ${action.type}`)
    }

    // Add action to session
    if (!session.actions) {
      session.actions = []
    }
    session.actions.push(action)
    session.updatedAt = new Date()

    this.sessions.set(sessionId, session)

    return action
  }

  async validateAction(sessionId: string, action: GameAction): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    // Basic validation rules
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // Check timestamp is not too far in the past or future
    if (action.timestamp < fiveMinutesAgo || action.timestamp > now) {
      this.logger.warn(`Invalid action timestamp for session ${sessionId}:`, {
        actionTime: action.timestamp,
        serverTime: now,
      })
      return false
    }

    // Check sequence number
    const lastSequence = Math.max(...(session.actions?.map((a) => a.sequence) || [0]))
    if (action.sequence <= lastSequence) {
      this.logger.warn(`Invalid sequence number for session ${sessionId}:`, {
        actionSequence: action.sequence,
        lastSequence,
      })
      return false
    }

    // Validate action type transitions
    const lastAction = session.actions?.[session.actions.length - 1]
    if (!this.isValidActionTransition(lastAction?.type, action.type)) {
      this.logger.warn(`Invalid action transition for session ${sessionId}:`, {
        from: lastAction?.type,
        to: action.type,
      })
      return false
    }

    return true
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    return this.sessions.get(sessionId) || null
  }

  async getUserSessions(userId: string, limit = 50): Promise<GameSession[]> {
    const sessionIds = this.userSessions.get(userId) || []
    const sessions = sessionIds
      .map((id) => this.sessions.get(id))
      .filter((session): session is GameSession => session !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)

    return sessions
  }

  async validateSession(session: GameSession): Promise<SessionIntegrityReport> {
    return this.integrityService.validateSession(session)
  }

  async detectAnomalies(session: GameSession): Promise<SessionAnomalyLog[]> {
    const report = await this.integrityService.validateSession(session)
    return report.anomalies
  }

  async getAnomalies(sessionId?: string, userId?: string): Promise<SessionAnomalyLog[]> {
    return this.integrityService.getAnomalies(sessionId, userId)
  }

  async resolveAnomaly(anomalyId: string, moderatorNotes: string): Promise<void> {
    return this.integrityService.resolveAnomaly(anomalyId, moderatorNotes)
  }

  // Helper methods
  private generateSessionToken(sessionId: string, userId: string): string {
    const tokenData = { sessionId, userId, timestamp: Date.now() }
    return Buffer.from(JSON.stringify(tokenData)).toString("base64")
  }

  private isValidActionTransition(fromAction?: string, toAction?: string): boolean {
    // Define valid action transitions
    const validTransitions: Record<string, string[]> = {
      undefined: ["start"],
      start: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      move: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      hint_request: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      pause: ["resume", "abandon"],
      resume: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      submit_answer: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      heartbeat: ["move", "hint_request", "pause", "submit_answer", "complete", "abandon", "heartbeat"],
      complete: [], // Terminal state
      abandon: [], // Terminal state
    }

    const allowedNext = validTransitions[fromAction || "undefined"] || []
    return allowedNext.includes(toAction || "")
  }

  // Statistics and monitoring
  async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    completedSessions: number
    abandonedSessions: number
    invalidSessions: number
    averageSessionDuration: number
  }> {
    const sessions = Array.from(this.sessions.values())
    const activeSessions = sessions.filter((s) => s.status === "active").length
    const completedSessions = sessions.filter((s) => s.status === "completed").length
    const abandonedSessions = sessions.filter((s) => s.status === "abandoned").length
    const invalidSessions = sessions.filter((s) => s.status === "invalid").length

    const completedWithDuration = sessions.filter((s) => s.status === "completed" && s.duration)
    const averageSessionDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / completedWithDuration.length
        : 0

    return {
      totalSessions: sessions.length,
      activeSessions,
      completedSessions,
      abandonedSessions,
      invalidSessions,
      averageSessionDuration,
    }
  }
}
