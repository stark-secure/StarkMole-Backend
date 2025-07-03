import { Injectable, Logger } from "@nestjs/common"
import { createHash, createHmac } from "crypto"
import type {
  GameSession,
  SessionValidationRules,
  AnomalyDetectionConfig,
  SessionAnomalyLog,
  SessionIntegrityReport,
  IntegrityCheckResult,
  AnomalyType,
} from "../interfaces/game-session.interface"

@Injectable()
export class SessionIntegrityService {
  private readonly logger = new Logger(SessionIntegrityService.name)
  private readonly secretKey = process.env.SESSION_SECRET_KEY || "default-secret-key"

  // Default validation rules - would be configurable per game type
  private readonly defaultRules: SessionValidationRules = {
    minDuration: 5000, // 5 seconds minimum
    maxDuration: 3600000, // 1 hour maximum
    maxScore: 1000,
    minScore: 0,
    maxActionsPerSecond: 10,
    requiredActions: ["start", "complete"],
    maxHints: 5,
    maxAttempts: 10,
    scoreThresholds: {
      suspicious: 950, // 95% of max score
      impossible: 1001, // Above theoretical maximum
    },
    timeThresholds: {
      tooFast: 10000, // 10 seconds - suspiciously fast
      tooSlow: 1800000, // 30 minutes - suspiciously slow
    },
  }

  private readonly defaultConfig: AnomalyDetectionConfig = {
    enableScoreValidation: true,
    enableTimeValidation: true,
    enableActionValidation: true,
    enableReplayDetection: true,
    enableRateLimiting: true,
    logLevel: "all",
    autoReject: false,
    moderationThreshold: 3,
  }

  // In-memory storage for demo - would use database in production
  private anomalyLogs: Map<string, SessionAnomalyLog> = new Map()
  private sessionHashes: Set<string> = new Set() // For replay detection

  async validateSession(
    session: GameSession,
    rules: SessionValidationRules = this.defaultRules,
    config: AnomalyDetectionConfig = this.defaultConfig,
  ): Promise<SessionIntegrityReport> {
    const checks: IntegrityCheckResult[] = []
    const anomalies: SessionAnomalyLog[] = []

    try {
      // 1. Score validation
      if (config.enableScoreValidation) {
        const scoreCheck = await this.validateScore(session, rules)
        checks.push(scoreCheck)
        if (scoreCheck.status === "failed") {
          const anomaly = await this.createAnomaly(session, "impossible_score", scoreCheck.message, scoreCheck.severity)
          anomalies.push(anomaly)
        }
      }

      // 2. Time validation
      if (config.enableTimeValidation) {
        const timeCheck = await this.validateTiming(session, rules)
        checks.push(timeCheck)
        if (timeCheck.status === "failed") {
          const anomaly = await this.createAnomaly(session, "suspicious_time", timeCheck.message, timeCheck.severity)
          anomalies.push(anomaly)
        }
      }

      // 3. Action sequence validation
      if (config.enableActionValidation) {
        const actionCheck = await this.validateActionSequence(session, rules)
        checks.push(actionCheck)
        if (actionCheck.status === "failed") {
          const anomaly = await this.createAnomaly(
            session,
            "invalid_sequence",
            actionCheck.message,
            actionCheck.severity,
          )
          anomalies.push(anomaly)
        }
      }

      // 4. Replay detection
      if (config.enableReplayDetection) {
        const replayCheck = await this.detectReplay(session)
        checks.push(replayCheck)
        if (replayCheck.status === "failed") {
          const anomaly = await this.createAnomaly(session, "replay_attack", replayCheck.message, replayCheck.severity)
          anomalies.push(anomaly)
        }
      }

      // 5. Rate limiting validation
      if (config.enableRateLimiting) {
        const rateLimitCheck = await this.validateRateLimit(session, rules)
        checks.push(rateLimitCheck)
        if (rateLimitCheck.status === "failed") {
          const anomaly = await this.createAnomaly(
            session,
            "rate_limit_exceeded",
            rateLimitCheck.message,
            rateLimitCheck.severity,
          )
          anomalies.push(anomaly)
        }
      }

      // 6. Signature verification (if present)
      if (session.signature) {
        const signatureCheck = await this.verifySignature(session)
        checks.push(signatureCheck)
        if (signatureCheck.status === "failed") {
          const anomaly = await this.createAnomaly(
            session,
            "tampered_data",
            signatureCheck.message,
            signatureCheck.severity,
          )
          anomalies.push(anomaly)
        }
      }

      // 7. Metadata validation
      const metadataCheck = await this.validateMetadata(session)
      checks.push(metadataCheck)
      if (metadataCheck.status === "failed") {
        const anomaly = await this.createAnomaly(
          session,
          "inconsistent_metadata",
          metadataCheck.message,
          metadataCheck.severity,
        )
        anomalies.push(anomaly)
      }

      // Calculate overall status and confidence
      const report = this.generateIntegrityReport(session.id, checks, anomalies, config)

      // Log anomalies
      if (config.logLevel !== "none") {
        await this.logAnomalies(anomalies, config.logLevel)
      }

      this.logger.log(`Session ${session.id} integrity check completed: ${report.overallStatus}`)

      return report
    } catch (error) {
      this.logger.error(`Error validating session ${session.id}:`, error)

      const errorCheck: IntegrityCheckResult = {
        checkType: "signature_verification",
        status: "failed",
        message: "Validation process failed",
        severity: "critical",
        timestamp: new Date(),
        details: { error: error.message },
      }

      return {
        sessionId: session.id,
        overallStatus: "invalid",
        confidenceScore: 0,
        checks: [errorCheck],
        anomalies: [],
        recommendation: "reject",
        riskScore: 100,
      }
    }
  }

  private async validateScore(session: GameSession, rules: SessionValidationRules): Promise<IntegrityCheckResult> {
    const score = session.score || 0
    const maxPossible = session.maxPossibleScore || rules.maxScore

    // Check if score exceeds theoretical maximum
    if (score > maxPossible) {
      return {
        checkType: "score_validation",
        status: "failed",
        message: `Score ${score} exceeds maximum possible ${maxPossible}`,
        severity: "critical",
        timestamp: new Date(),
        details: { score, maxPossible, difference: score - maxPossible },
      }
    }

    // Check if score is suspiciously high
    if (score > rules.scoreThresholds.suspicious) {
      return {
        checkType: "score_validation",
        status: "warning",
        message: `Score ${score} is suspiciously high (>${rules.scoreThresholds.suspicious})`,
        severity: "medium",
        timestamp: new Date(),
        details: { score, threshold: rules.scoreThresholds.suspicious },
      }
    }

    // Check if score is below minimum
    if (score < rules.minScore) {
      return {
        checkType: "score_validation",
        status: "failed",
        message: `Score ${score} is below minimum ${rules.minScore}`,
        severity: "low",
        timestamp: new Date(),
        details: { score, minScore: rules.minScore },
      }
    }

    return {
      checkType: "score_validation",
      status: "passed",
      message: "Score validation passed",
      severity: "low",
      timestamp: new Date(),
      details: { score, maxPossible },
    }
  }

  private async validateTiming(session: GameSession, rules: SessionValidationRules): Promise<IntegrityCheckResult> {
    const duration = session.duration || 0
    const startTime = session.startedAt
    const endTime = session.endedAt

    // Check duration bounds
    if (duration < rules.minDuration) {
      return {
        checkType: "time_validation",
        status: "failed",
        message: `Session duration ${duration}ms is too short (min: ${rules.minDuration}ms)`,
        severity: "high",
        timestamp: new Date(),
        details: { duration, minDuration: rules.minDuration },
      }
    }

    if (duration > rules.maxDuration) {
      return {
        checkType: "time_validation",
        status: "failed",
        message: `Session duration ${duration}ms exceeds maximum (max: ${rules.maxDuration}ms)`,
        severity: "medium",
        timestamp: new Date(),
        details: { duration, maxDuration: rules.maxDuration },
      }
    }

    // Check for suspiciously fast completion
    if (duration < rules.timeThresholds.tooFast && session.score && session.score > 0) {
      return {
        checkType: "time_validation",
        status: "warning",
        message: `Completion time ${duration}ms is suspiciously fast`,
        severity: "high",
        timestamp: new Date(),
        details: { duration, threshold: rules.timeThresholds.tooFast, score: session.score },
      }
    }

    // Validate timestamp consistency
    if (startTime && endTime && endTime < startTime) {
      return {
        checkType: "time_validation",
        status: "failed",
        message: "End time is before start time",
        severity: "critical",
        timestamp: new Date(),
        details: { startTime, endTime },
      }
    }

    return {
      checkType: "time_validation",
      status: "passed",
      message: "Time validation passed",
      severity: "low",
      timestamp: new Date(),
      details: { duration },
    }
  }

  private async validateActionSequence(
    session: GameSession,
    rules: SessionValidationRules,
  ): Promise<IntegrityCheckResult> {
    const actions = session.actions || []

    // Check for required actions
    const actionTypes = new Set(actions.map((a) => a.type))
    const missingActions = rules.requiredActions.filter((required) => !actionTypes.has(required))

    if (missingActions.length > 0) {
      return {
        checkType: "action_sequence",
        status: "failed",
        message: `Missing required actions: ${missingActions.join(", ")}`,
        severity: "high",
        timestamp: new Date(),
        details: { missingActions, presentActions: Array.from(actionTypes) },
      }
    }

    // Check action sequence order
    const startAction = actions.find((a) => a.type === "start")
    const completeAction = actions.find((a) => a.type === "complete")

    if (startAction && completeAction && startAction.timestamp > completeAction.timestamp) {
      return {
        checkType: "action_sequence",
        status: "failed",
        message: "Start action timestamp is after complete action",
        severity: "critical",
        timestamp: new Date(),
        details: { startTime: startAction.timestamp, completeTime: completeAction.timestamp },
      }
    }

    // Check for duplicate sequence numbers
    const sequences = actions.map((a) => a.sequence)
    const uniqueSequences = new Set(sequences)
    if (sequences.length !== uniqueSequences.size) {
      return {
        checkType: "action_sequence",
        status: "failed",
        message: "Duplicate sequence numbers detected",
        severity: "high",
        timestamp: new Date(),
        details: { totalActions: sequences.length, uniqueSequences: uniqueSequences.size },
      }
    }

    // Check for actions with future timestamps
    const now = new Date()
    const futureActions = actions.filter((a) => a.timestamp > now)
    if (futureActions.length > 0) {
      return {
        checkType: "action_sequence",
        status: "failed",
        message: `${futureActions.length} actions have future timestamps`,
        severity: "high",
        timestamp: new Date(),
        details: { futureActions: futureActions.length, currentTime: now },
      }
    }

    return {
      checkType: "action_sequence",
      status: "passed",
      message: "Action sequence validation passed",
      severity: "low",
      timestamp: new Date(),
      details: { totalActions: actions.length, actionTypes: Array.from(actionTypes) },
    }
  }

  private async detectReplay(session: GameSession): Promise<IntegrityCheckResult> {
    // Create a hash of the session's critical data
    const sessionHash = this.createSessionHash(session)

    if (this.sessionHashes.has(sessionHash)) {
      return {
        checkType: "replay_detection",
        status: "failed",
        message: "Identical session detected (possible replay attack)",
        severity: "critical",
        timestamp: new Date(),
        details: { sessionHash },
      }
    }

    // Store the hash for future comparisons
    this.sessionHashes.add(sessionHash)

    return {
      checkType: "replay_detection",
      status: "passed",
      message: "No replay detected",
      severity: "low",
      timestamp: new Date(),
      details: { sessionHash },
    }
  }

  private async validateRateLimit(session: GameSession, rules: SessionValidationRules): Promise<IntegrityCheckResult> {
    const actions = session.actions || []
    const duration = session.duration || 1

    if (duration === 0) {
      return {
        checkType: "rate_limiting",
        status: "failed",
        message: "Zero duration session with actions",
        severity: "critical",
        timestamp: new Date(),
        details: { actions: actions.length, duration },
      }
    }

    const actionsPerSecond = (actions.length * 1000) / duration
    const maxAllowed = rules.maxActionsPerSecond

    if (actionsPerSecond > maxAllowed) {
      return {
        checkType: "rate_limiting",
        status: "failed",
        message: `Action rate ${actionsPerSecond.toFixed(2)}/sec exceeds limit ${maxAllowed}/sec`,
        severity: "high",
        timestamp: new Date(),
        details: { actionsPerSecond, maxAllowed, totalActions: actions.length, duration },
      }
    }

    // Check for burst patterns (many actions in short time windows)
    const burstThreshold = 5 // 5 actions in 1 second
    const windowSize = 1000 // 1 second window

    for (let i = 0; i < actions.length - burstThreshold; i++) {
      const windowStart = actions[i].timestamp
      const windowEnd = new Date(windowStart.getTime() + windowSize)
      const actionsInWindow = actions.filter(
        (a, idx) => idx >= i && a.timestamp >= windowStart && a.timestamp <= windowEnd,
      ).length

      if (actionsInWindow > burstThreshold) {
        return {
          checkType: "rate_limiting",
          status: "warning",
          message: `Burst pattern detected: ${actionsInWindow} actions in 1 second`,
          severity: "medium",
          timestamp: new Date(),
          details: { actionsInWindow, burstThreshold, windowStart },
        }
      }
    }

    return {
      checkType: "rate_limiting",
      status: "passed",
      message: "Rate limit validation passed",
      severity: "low",
      timestamp: new Date(),
      details: { actionsPerSecond: actionsPerSecond.toFixed(2), maxAllowed },
    }
  }

  private async verifySignature(session: GameSession): Promise<IntegrityCheckResult> {
    if (!session.signature) {
      return {
        checkType: "signature_verification",
        status: "warning",
        message: "No signature provided",
        severity: "low",
        timestamp: new Date(),
      }
    }

    try {
      const expectedSignature = this.generateSessionSignature(session)
      const isValid = session.signature === expectedSignature

      if (!isValid) {
        return {
          checkType: "signature_verification",
          status: "failed",
          message: "Session signature verification failed",
          severity: "critical",
          timestamp: new Date(),
          details: { provided: session.signature, expected: expectedSignature },
        }
      }

      return {
        checkType: "signature_verification",
        status: "passed",
        message: "Signature verification passed",
        severity: "low",
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: "signature_verification",
        status: "failed",
        message: `Signature verification error: ${error.message}`,
        severity: "high",
        timestamp: new Date(),
        details: { error: error.message },
      }
    }
  }

  private async validateMetadata(session: GameSession): Promise<IntegrityCheckResult> {
    const metadata = session.metadata || {}
    const issues: string[] = []

    // Check for required metadata fields
    const requiredFields = ["userAgent", "ipAddress"]
    for (const field of requiredFields) {
      if (!metadata[field]) {
        issues.push(`Missing ${field}`)
      }
    }

    // Validate IP address format
    if (metadata.ipAddress && !this.isValidIP(metadata.ipAddress)) {
      issues.push("Invalid IP address format")
    }

    // Check for suspicious user agent
    if (metadata.userAgent && this.isSuspiciousUserAgent(metadata.userAgent)) {
      issues.push("Suspicious user agent detected")
    }

    // Validate hints and attempts
    if (metadata.hints && metadata.hints < 0) {
      issues.push("Negative hint count")
    }

    if (metadata.attempts && metadata.attempts < 1) {
      issues.push("Invalid attempt count")
    }

    if (issues.length > 0) {
      return {
        checkType: "metadata_validation",
        status: "failed",
        message: `Metadata validation failed: ${issues.join(", ")}`,
        severity: "medium",
        timestamp: new Date(),
        details: { issues, metadata },
      }
    }

    return {
      checkType: "metadata_validation",
      status: "passed",
      message: "Metadata validation passed",
      severity: "low",
      timestamp: new Date(),
      details: { metadata },
    }
  }

  private generateIntegrityReport(
    sessionId: string,
    checks: IntegrityCheckResult[],
    anomalies: SessionAnomalyLog[],
    config: AnomalyDetectionConfig,
  ): SessionIntegrityReport {
    const failedChecks = checks.filter((c) => c.status === "failed")
    const warningChecks = checks.filter((c) => c.status === "warning")
    const criticalAnomalies = anomalies.filter((a) => a.severity === "critical")
    const highAnomalies = anomalies.filter((a) => a.severity === "high")

    // Calculate confidence score (0-100)
    let confidenceScore = 100
    confidenceScore -= failedChecks.length * 20
    confidenceScore -= warningChecks.length * 10
    confidenceScore -= criticalAnomalies.length * 30
    confidenceScore -= highAnomalies.length * 15
    confidenceScore = Math.max(0, confidenceScore)

    // Calculate risk score (0-100)
    let riskScore = 0
    riskScore += failedChecks.length * 25
    riskScore += warningChecks.length * 10
    riskScore += criticalAnomalies.length * 40
    riskScore += highAnomalies.length * 20
    riskScore = Math.min(100, riskScore)

    // Determine overall status
    let overallStatus: "valid" | "suspicious" | "invalid"
    if (criticalAnomalies.length > 0 || failedChecks.some((c) => c.severity === "critical")) {
      overallStatus = "invalid"
    } else if (anomalies.length > 0 || failedChecks.length > 0 || warningChecks.length > 1) {
      overallStatus = "suspicious"
    } else {
      overallStatus = "valid"
    }

    // Determine recommendation
    let recommendation: "accept" | "review" | "reject"
    if (overallStatus === "invalid" || (config.autoReject && riskScore > 70)) {
      recommendation = "reject"
    } else if (overallStatus === "suspicious" || riskScore > 30) {
      recommendation = "review"
    } else {
      recommendation = "accept"
    }

    return {
      sessionId,
      overallStatus,
      confidenceScore,
      checks,
      anomalies,
      recommendation,
      riskScore,
    }
  }

  private async createAnomaly(
    session: GameSession,
    type: AnomalyType,
    description: string,
    severity: "low" | "medium" | "high" | "critical",
  ): Promise<SessionAnomalyLog> {
    const anomaly: SessionAnomalyLog = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      userId: session.userId,
      anomalyType: type,
      severity,
      description,
      detectedAt: new Date(),
      metadata: {
        sessionType: session.sessionType,
        score: session.score,
        duration: session.duration,
        actionsCount: session.actions?.length || 0,
      },
      resolved: false,
    }

    this.anomalyLogs.set(anomaly.id, anomaly)
    return anomaly
  }

  private async logAnomalies(anomalies: SessionAnomalyLog[], logLevel: string): Promise<void> {
    for (const anomaly of anomalies) {
      if (logLevel === "all" || (logLevel === "warnings" && anomaly.severity !== "low")) {
        this.logger.warn(`Session anomaly detected:`, {
          sessionId: anomaly.sessionId,
          userId: anomaly.userId,
          type: anomaly.anomalyType,
          severity: anomaly.severity,
          description: anomaly.description,
        })
      }
    }
  }

  private createSessionHash(session: GameSession): string {
    // Create hash from critical session data to detect replays
    const criticalData = {
      userId: session.userId,
      puzzleId: session.puzzleId,
      moduleId: session.moduleId,
      score: session.score,
      duration: session.duration,
      actions: session.actions?.map((a) => ({ type: a.type, sequence: a.sequence, data: a.data })),
    }

    return createHash("sha256").update(JSON.stringify(criticalData)).digest("hex")
  }

  generateSessionSignature(session: GameSession): string {
    // Generate HMAC signature for session integrity
    const signatureData = {
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      score: session.score,
      duration: session.duration,
    }

    return createHmac("sha256", this.secretKey).update(JSON.stringify(signatureData)).digest("hex")
  }

  private isValidIP(ip: string): boolean {
    // Simple IP validation (IPv4)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    return ipv4Regex.test(ip)
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    // Check for common bot patterns or suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automated/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent))
  }

  // Public methods for anomaly management
  async getAnomalies(sessionId?: string, userId?: string): Promise<SessionAnomalyLog[]> {
    let anomalies = Array.from(this.anomalyLogs.values())

    if (sessionId) {
      anomalies = anomalies.filter((a) => a.sessionId === sessionId)
    }

    if (userId) {
      anomalies = anomalies.filter((a) => a.userId === userId)
    }

    return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
  }

  async resolveAnomaly(anomalyId: string, moderatorNotes: string): Promise<void> {
    const anomaly = this.anomalyLogs.get(anomalyId)
    if (anomaly) {
      anomaly.resolved = true
      anomaly.moderatorNotes = moderatorNotes
      this.anomalyLogs.set(anomalyId, anomaly)
      this.logger.log(`Anomaly ${anomalyId} resolved by moderator`)
    }
  }

  async getIntegrityStats(): Promise<{
    totalSessions: number
    validSessions: number
    suspiciousSessions: number
    invalidSessions: number
    totalAnomalies: number
    unresolvedAnomalies: number
  }> {
    const anomalies = Array.from(this.anomalyLogs.values())

    return {
      totalSessions: this.sessionHashes.size,
      validSessions: 0, // Would be calculated from actual session data
      suspiciousSessions: 0,
      invalidSessions: 0,
      totalAnomalies: anomalies.length,
      unresolvedAnomalies: anomalies.filter((a) => !a.resolved).length,
    }
  }
}
