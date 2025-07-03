import { Test, type TestingModule } from "@nestjs/testing"
import { SessionIntegrityService } from "../session-integrity.service"
import type { GameSession, SessionValidationRules } from "../../interfaces/game-session.interface"

describe("SessionIntegrityService", () => {
  let service: SessionIntegrityService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionIntegrityService],
    }).compile()

    service = module.get<SessionIntegrityService>(SessionIntegrityService)
  })

  const createMockSession = (overrides: Partial<GameSession> = {}): GameSession => ({
    id: "session_123",
    userId: "user_123",
    sessionType: "puzzle",
    status: "completed",
    startedAt: new Date("2024-01-01T10:00:00Z"),
    endedAt: new Date("2024-01-01T10:05:00Z"),
    duration: 300000, // 5 minutes
    score: 85,
    maxPossibleScore: 100,
    actions: [
      {
        id: "action_1",
        type: "start",
        timestamp: new Date("2024-01-01T10:00:00Z"),
        data: {},
        sequence: 1,
        serverTimestamp: new Date("2024-01-01T10:00:00Z"),
      },
      {
        id: "action_2",
        type: "complete",
        timestamp: new Date("2024-01-01T10:05:00Z"),
        data: { score: 85 },
        sequence: 2,
        serverTimestamp: new Date("2024-01-01T10:05:00Z"),
      },
    ],
    metadata: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ipAddress: "192.168.1.1",
      hints: 1,
      attempts: 1,
    },
    integrityChecks: [],
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:05:00Z"),
    ...overrides,
  })

  describe("validateSession", () => {
    it("should pass validation for a valid session", async () => {
      const session = createMockSession()
      const report = await service.validateSession(session)

      expect(report.overallStatus).toBe("valid")
      expect(report.confidenceScore).toBeGreaterThan(80)
      expect(report.recommendation).toBe("accept")
      expect(report.checks.every((check) => check.status === "passed")).toBe(true)
    })

    it("should detect impossible score", async () => {
      const session = createMockSession({
        score: 150,
        maxPossibleScore: 100,
      })

      const report = await service.validateSession(session)

      expect(report.overallStatus).toBe("invalid")
      expect(report.recommendation).toBe("reject")
      expect(report.checks.some((check) => check.checkType === "score_validation" && check.status === "failed")).toBe(
        true,
      )
      expect(report.anomalies.some((anomaly) => anomaly.anomalyType === "impossible_score")).toBe(true)
    })

    it("should detect suspiciously fast completion", async () => {
      const session = createMockSession({
        duration: 5000, // 5 seconds
        startedAt: new Date("2024-01-01T10:00:00Z"),
        endedAt: new Date("2024-01-01T10:00:05Z"),
        score: 95,
      })

      const rules: SessionValidationRules = {
        minDuration: 1000,
        maxDuration: 3600000,
        maxScore: 100,
        minScore: 0,
        maxActionsPerSecond: 10,
        requiredActions: ["start", "complete"],
        maxHints: 5,
        maxAttempts: 10,
        scoreThresholds: { suspicious: 90, impossible: 101 },
        timeThresholds: { tooFast: 10000, tooSlow: 1800000 },
      }

      const report = await service.validateSession(session, rules)

      expect(report.overallStatus).toBe("suspicious")
      expect(report.checks.some((check) => check.checkType === "time_validation" && check.status === "warning")).toBe(
        true,
      )
    })

    it("should detect missing required actions", async () => {
      const session = createMockSession({
        actions: [
          {
            id: "action_1",
            type: "start",
            timestamp: new Date("2024-01-01T10:00:00Z"),
            data: {},
            sequence: 1,
            serverTimestamp: new Date("2024-01-01T10:00:00Z"),
          },
          // Missing 'complete' action
        ],
      })

      const report = await service.validateSession(session)

      expect(report.overallStatus).toBe("invalid")
      expect(report.checks.some((check) => check.checkType === "action_sequence" && check.status === "failed")).toBe(
        true,
      )
    })

    it("should detect rate limit violations", async () => {
      const actions = Array.from({ length: 50 }, (_, i) => ({
        id: `action_${i}`,
        type: "move" as const,
        timestamp: new Date("2024-01-01T10:00:00Z"),
        data: {},
        sequence: i + 1,
        serverTimestamp: new Date("2024-01-01T10:00:00Z"),
      }))

      const session = createMockSession({
        duration: 1000, // 1 second with 50 actions = 50 actions/sec
        actions,
      })

      const report = await service.validateSession(session)

      expect(report.overallStatus).toBe("invalid")
      expect(report.checks.some((check) => check.checkType === "rate_limiting" && check.status === "failed")).toBe(true)
    })

    it("should detect replay attacks", async () => {
      const session1 = createMockSession({ id: "session_1" })
      const session2 = createMockSession({ id: "session_2" })

      // First session should pass
      const report1 = await service.validateSession(session1)
      expect(report1.checks.some((check) => check.checkType === "replay_detection" && check.status === "passed")).toBe(
        true,
      )

      // Second identical session should fail
      const report2 = await service.validateSession(session2)
      expect(report2.checks.some((check) => check.checkType === "replay_detection" && check.status === "failed")).toBe(
        true,
      )
    })

    it("should detect invalid metadata", async () => {
      const session = createMockSession({
        metadata: {
          userAgent: "bot/1.0", // Suspicious user agent
          ipAddress: "invalid-ip",
          hints: -1, // Invalid negative hints
        },
      })

      const report = await service.validateSession(session)

      expect(report.overallStatus).toBe("suspicious")
      expect(
        report.checks.some((check) => check.checkType === "metadata_validation" && check.status === "failed"),
      ).toBe(true)
    })

    it("should verify session signatures", async () => {
      const session = createMockSession()
      session.signature = service.generateSessionSignature(session)

      const report = await service.validateSession(session)

      expect(
        report.checks.some((check) => check.checkType === "signature_verification" && check.status === "passed"),
      ).toBe(true)
    })

    it("should detect tampered signatures", async () => {
      const session = createMockSession({
        signature: "invalid_signature",
      })

      const report = await service.validateSession(session)

      expect(
        report.checks.some((check) => check.checkType === "signature_verification" && check.status === "failed"),
      ).toBe(true)
      expect(report.anomalies.some((anomaly) => anomaly.anomalyType === "tampered_data")).toBe(true)
    })

    it("should handle validation errors gracefully", async () => {
      const invalidSession = {} as GameSession

      const report = await service.validateSession(invalidSession)

      expect(report.overallStatus).toBe("invalid")
      expect(report.recommendation).toBe("reject")
      expect(report.checks.some((check) => check.status === "failed")).toBe(true)
    })
  })
})
