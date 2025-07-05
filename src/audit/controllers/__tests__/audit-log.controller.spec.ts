import { Test, type TestingModule } from "@nestjs/testing"
import { AuditLogController } from "../audit-log.controller"
import { AuditLogService } from "../../../common/services/audit-log.service"
import type { GetAuditLogsDto } from "../../../common/dto/audit-log.dto"
import { jest } from "@jest/globals"

describe("AuditLogController", () => {
  let controller: AuditLogController
  let service: jest.Mocked<AuditLogService>

  const mockAuditLog = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "user-123",
    actionType: "USER_LOGIN",
    metadata: { ip: "127.0.0.1" },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    resource: "auth",
    result: "SUCCESS",
  }

  beforeEach(async () => {
    const mockService = {
      findLogs: jest.fn(),
      getLogStats: jest.fn(),
      getLogById: jest.fn(),
      getLogsByUser: jest.fn(),
      getLogsByActionType: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<AuditLogController>(AuditLogController)
    service = module.get(AuditLogService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getAuditLogs", () => {
    it("should return paginated audit logs", async () => {
      const query: GetAuditLogsDto = {
        page: 1,
        limit: 50,
        userId: "user-123",
        actionType: "USER_LOGIN",
      }

      const expectedResponse = {
        logs: [mockAuditLog],
        total: 1,
        page: 1,
        totalPages: 1,
      }

      service.findLogs.mockResolvedValue(expectedResponse)

      const result = await controller.getAuditLogs(query)

      expect(service.findLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        userId: "user-123",
        actionType: "USER_LOGIN",
        startDate: undefined,
        endDate: undefined,
      })
      expect(result).toEqual(expectedResponse)
    })

    it("should handle date filters", async () => {
      const query: GetAuditLogsDto = {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-02T00:00:00Z",
      }

      service.findLogs.mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0,
      })

      await controller.getAuditLogs(query)

      expect(service.findLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-01-02T00:00:00Z"),
      })
    })
  })

  describe("getAuditLogStats", () => {
    it("should return audit log statistics", async () => {
      const expectedStats = {
        totalLogs: 100,
        logsByAction: {
          USER_LOGIN: 50,
          USER_LOGOUT: 30,
          USER_CREATED: 20,
        },
        recentActivity: 10,
      }

      service.getLogStats.mockResolvedValue(expectedStats)

      const result = await controller.getAuditLogStats()

      expect(service.getLogStats).toHaveBeenCalled()
      expect(result).toEqual(expectedStats)
    })
  })

  describe("getAuditLogById", () => {
    it("should return specific audit log", async () => {
      service.getLogById.mockResolvedValue(mockAuditLog)

      const result = await controller.getAuditLogById("123")

      expect(service.getLogById).toHaveBeenCalledWith("123")
      expect(result).toEqual(mockAuditLog)
    })

    it("should throw error when log not found", async () => {
      service.getLogById.mockResolvedValue(null)

      await expect(controller.getAuditLogById("nonexistent")).rejects.toThrow("Audit log not found")
    })
  })

  describe("getUserAuditLogs", () => {
    it("should return logs for specific user", async () => {
      const logs = [mockAuditLog]
      service.getLogsByUser.mockResolvedValue(logs)

      const result = await controller.getUserAuditLogs("user-123")

      expect(service.getLogsByUser).toHaveBeenCalledWith("user-123", 100)
      expect(result).toEqual(logs)
    })

    it("should respect limit parameter", async () => {
      service.getLogsByUser.mockResolvedValue([])

      await controller.getUserAuditLogs("user-123", 50)

      expect(service.getLogsByUser).toHaveBeenCalledWith("user-123", 50)
    })
  })

  describe("getActionAuditLogs", () => {
    it("should return logs for specific action type", async () => {
      const logs = [mockAuditLog]
      service.getLogsByActionType.mockResolvedValue(logs)

      const result = await controller.getActionAuditLogs("USER_LOGIN")

      expect(service.getLogsByActionType).toHaveBeenCalledWith("USER_LOGIN", 100)
      expect(result).toEqual(logs)
    })

    it("should respect limit parameter", async () => {
      service.getLogsByActionType.mockResolvedValue([])

      await controller.getActionAuditLogs("USER_LOGIN", 50)

      expect(service.getLogsByActionType).toHaveBeenCalledWith("USER_LOGIN", 50)
    })
  })
})
