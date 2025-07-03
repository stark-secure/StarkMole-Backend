import { Controller, Get, Post, Put, NotFoundException, BadRequestException } from "@nestjs/common"
import type { GameSessionServiceImpl } from "./game-session.service"
import { ResponseUtil } from "../utils/response.util"
import type { SessionType } from "../interfaces/game-session.interface"

export interface StartSessionDto {
  sessionType: SessionType
  puzzleId?: string
  moduleId?: string
  metadata?: Record<string, any>
}

export interface EndSessionDto {
  score?: number
  metadata?: Record<string, any>
}

export interface RecordActionDto {
  type: string
  data: Record<string, any>
  clientTimestamp?: Date
}

export interface ResolveAnomalyDto {
  moderatorNotes: string
}

@Controller()
export class GameSessionController {
  constructor(private readonly gameSessionService: GameSessionServiceImpl) {}

  // Session Management Endpoints
  @Post("users/:userId/sessions")
  async startSession(userId: string, dto: StartSessionDto) {
    try {
      const session = await this.gameSessionService.startSession(userId, dto.sessionType, dto.puzzleId, dto.moduleId)
      return ResponseUtil.success(session, "Game session started successfully")
    } catch (error) {
      throw new BadRequestException("Failed to start game session")
    }
  }

  @Put("sessions/:sessionId/end")
  async endSession(sessionId: string, dto: EndSessionDto) {
    try {
      const integrityReport = await this.gameSessionService.endSession(sessionId, dto)
      return ResponseUtil.success(
        {
          session: await this.gameSessionService.getSession(sessionId),
          integrityReport,
        },
        `Session ended with status: ${integrityReport.overallStatus}`,
      )
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to end game session")
    }
  }

  @Put("sessions/:sessionId/pause")
  async pauseSession(sessionId: string) {
    try {
      const session = await this.gameSessionService.pauseSession(sessionId)
      return ResponseUtil.success(session, "Session paused successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to pause session")
    }
  }

  @Put("sessions/:sessionId/resume")
  async resumeSession(sessionId: string) {
    try {
      const session = await this.gameSessionService.resumeSession(sessionId)
      return ResponseUtil.success(session, "Session resumed successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to resume session")
    }
  }

  @Put("sessions/:sessionId/abandon")
  async abandonSession(sessionId: string) {
    try {
      const session = await this.gameSessionService.abandonSession(sessionId)
      return ResponseUtil.success(session, "Session abandoned successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to abandon session")
    }
  }

  // Action Recording Endpoints
  @Post("sessions/:sessionId/actions")
  async recordAction(sessionId: string, dto: RecordActionDto) {
    try {
      const action = await this.gameSessionService.recordAction(sessionId, {
        type: dto.type as any,
        timestamp: new Date(),
        data: dto.data,
        sequence: 0, // Will be set by the service
        clientTimestamp: dto.clientTimestamp,
      })
      return ResponseUtil.success(action, "Action recorded successfully")
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException("Failed to record action")
    }
  }

  // Session Retrieval Endpoints
  @Get("sessions/:sessionId")
  async getSession(sessionId: string) {
    const session = await this.gameSessionService.getSession(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }
    return ResponseUtil.success(session, "Session retrieved successfully")
  }

  @Get("users/:userId/sessions")
  async getUserSessions(userId: string, limit?: number) {
    const sessions = await this.gameSessionService.getUserSessions(userId, limit)
    return ResponseUtil.success(sessions, "User sessions retrieved successfully")
  }

  // Integrity and Validation Endpoints
  @Post("sessions/:sessionId/validate")
  async validateSession(sessionId: string) {
    const session = await this.gameSessionService.getSession(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    const integrityReport = await this.gameSessionService.validateSession(session)
    return ResponseUtil.success(integrityReport, "Session validation completed")
  }

  @Get("sessions/:sessionId/anomalies")
  async getSessionAnomalies(sessionId: string) {
    const anomalies = await this.gameSessionService.getAnomalies(sessionId)
    return ResponseUtil.success(anomalies, "Session anomalies retrieved successfully")
  }

  @Get("users/:userId/anomalies")
  async getUserAnomalies(userId: string) {
    const anomalies = await this.gameSessionService.getAnomalies(undefined, userId)
    return ResponseUtil.success(anomalies, "User anomalies retrieved successfully")
  }

  @Put("anomalies/:anomalyId/resolve")
  async resolveAnomaly(anomalyId: string, dto: ResolveAnomalyDto) {
    try {
      await this.gameSessionService.resolveAnomaly(anomalyId, dto.moderatorNotes)
      return ResponseUtil.success(null, "Anomaly resolved successfully")
    } catch (error) {
      throw new BadRequestException("Failed to resolve anomaly")
    }
  }

  // Statistics and Monitoring Endpoints
  @Get("sessions/stats")
  async getSessionStats() {
    const stats = await this.gameSessionService.getSessionStats()
    return ResponseUtil.success(stats, "Session statistics retrieved successfully")
  }

  @Get("sessions/integrity/stats")
  async getIntegrityStats() {
    // This would typically be implemented in the integrity service
    const stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      suspiciousValidations: 0,
      averageConfidenceScore: 0,
      commonAnomalies: [],
    }
    return ResponseUtil.success(stats, "Integrity statistics retrieved successfully")
  }

  // Admin Endpoints
  @Get("admin/sessions/suspicious")
  async getSuspiciousSessions(limit = 50) {
    // This would filter sessions marked as suspicious
    const allSessions = Array.from((this.gameSessionService as any).sessions.values())
    const suspiciousSessions = allSessions
      .filter((session) => session.status === "under_review" || session.status === "invalid")
      .slice(0, limit)

    return ResponseUtil.success(suspiciousSessions, "Suspicious sessions retrieved successfully")
  }

  @Post("admin/sessions/:sessionId/review")
  async reviewSession(sessionId: string, action: "approve" | "reject", notes?: string) {
    const session = await this.gameSessionService.getSession(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    // Update session status based on review
    if (action === "approve") {
      session.status = "completed"
    } else {
      session.status = "invalid"
    }
    // In a real implementation, this would update the database
    ;(this.gameSessionService as any).sessions.set(sessionId, session)

    return ResponseUtil.success(
      { sessionId, action, notes },
      `Session ${action === "approve" ? "approved" : "rejected"} successfully`,
    )
  }
}
