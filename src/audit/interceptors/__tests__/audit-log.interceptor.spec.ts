import { Test, type TestingModule } from "@nestjs/testing"
import type { ExecutionContext, CallHandler } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { of, throwError } from "rxjs"
import { AuditLogInterceptor, type AuditLogMetadata } from "../audit-log.interceptor"
import { AuditLogService } from "../../services/audit-log.service"
import { jest } from "@jest/globals"

describe("AuditLogInterceptor", () => {
  let interceptor: AuditLogInterceptor
  let auditLogService: jest.Mocked<AuditLogService>
  let reflector: jest.Mocked<Reflector>

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
    getHandler: jest.fn(),
  } as unknown as ExecutionContext

  const mockCallHandler = {
    handle: jest.fn(),
  } as unknown as CallHandler

  const mockRequest = {
    method: "POST",
    url: "/api/users",
    params: { id: "123" },
    body: { name: "John", password: "secret" },
    headers: { "user-agent": "Mozilla/5.0" },
    connection: { remoteAddress: "127.0.0.1" },
    user: { id: "user-123" },
  }

  beforeEach(async () => {
    const mockAuditLogService = {
      logAction: jest.fn(),
    }

    const mockReflector = {
      get: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogInterceptor,
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile()

    interceptor = module.get<AuditLogInterceptor>(AuditLogInterceptor)
    auditLogService = module.get(AuditLogService)
    reflector = module.get(Reflector)
  })

  it("should be defined", () => {
    expect(interceptor).toBeDefined()
  })

  it("should pass through when no audit metadata is found", (done) => {
    reflector.get.mockReturnValue(undefined)
    ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of("response"))

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toBe("response")
        expect(auditLogService.logAction).not.toHaveBeenCalled()
        done()
      },
    })
  })

  it("should pass through when no user is found in request", (done) => {
    const metadata: AuditLogMetadata = {
      actionType: "USER_CREATED",
      resource: "users",
    }

    reflector.get.mockReturnValue(metadata)
    ;(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      ...mockRequest,
      user: undefined,
    })
    ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of("response"))

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toBe("response")
        expect(auditLogService.logAction).not.toHaveBeenCalled()
        done()
      },
    })
  })

  it("should log successful action", (done) => {
    const metadata: AuditLogMetadata = {
      actionType: "USER_CREATED",
      resource: "users",
      includeBody: true,
      includeParams: true,
    }

    reflector.get.mockReturnValue(metadata)
    ;(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest)
    ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of("success response"))

    auditLogService.logAction.mockResolvedValue({} as any)

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toBe("success response")

        // Give a small delay for async logging
        setTimeout(() => {
          expect(auditLogService.logAction).toHaveBeenCalledWith({
            actionType: "USER_CREATED",
            userId: "user-123",
            metadata: expect.objectContaining({
              method: "POST",
              url: "/api/users",
              result: "SUCCESS",
              params: { id: "123" },
              requestBody: { name: "John", password: "[REDACTED]" },
              responseSize: expect.any(Number),
              duration: expect.any(Number),
            }),
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0",
            resource: "users",
            result: "SUCCESS",
          })
          done()
        }, 10)
      },
    })
  })

  it("should log failed action", (done) => {
    const metadata: AuditLogMetadata = {
      actionType: "USER_CREATED",
      resource: "users",
    }

    const error = new Error("Validation failed")

    reflector.get.mockReturnValue(metadata)
    ;(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest)
    ;(mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => error))

    auditLogService.logAction.mockResolvedValue({} as any)

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error)

        // Give a small delay for async logging
        setTimeout(() => {
          expect(auditLogService.logAction).toHaveBeenCalledWith({
            actionType: "USER_CREATED",
            userId: "user-123",
            metadata: expect.objectContaining({
              method: "POST",
              url: "/api/users",
              result: "ERROR",
              error: "Validation failed",
              duration: expect.any(Number),
            }),
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0",
            resource: "users",
            result: "ERROR",
          })
          done()
        }, 10)
      },
    })
  })

  it("should sanitize sensitive data in request body", (done) => {
    const metadata: AuditLogMetadata = {
      actionType: "USER_CREATED",
      includeBody: true,
    }

    const requestWithSensitiveData = {
      ...mockRequest,
      body: {
        name: "John",
        password: "secret123",
        token: "jwt-token",
        secret: "api-secret",
        key: "encryption-key",
        authorization: "Bearer token",
        normalField: "normal-value",
      },
    }

    reflector.get.mockReturnValue(metadata)
    ;(mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(requestWithSensitiveData)
    ;(mockCallHandler.handle as jest.Mock).mockReturnValue(of("response"))

    auditLogService.logAction.mockResolvedValue({} as any)

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        setTimeout(() => {
          expect(auditLogService.logAction).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({
                requestBody: {
                  name: "John",
                  password: "[REDACTED]",
                  token: "[REDACTED]",
                  secret: "[REDACTED]",
                  key: "[REDACTED]",
                  authorization: "[REDACTED]",
                  normalField: "normal-value",
                },
              }),
            }),
          )
          done()
        }, 10)
      },
    })
  })

  it("should extract IP address from various headers", () => {
    const testCases = [
      {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
        expected: "192.168.1.1",
      },
      {
        headers: { "x-real-ip": "192.168.1.2" },
        expected: "192.168.1.2",
      },
      {
        headers: {},
        connection: { remoteAddress: "192.168.1.3" },
        expected: "192.168.1.3",
      },
    ]

    testCases.forEach(({ headers, connection, expected }) => {
      const request = { headers, connection }
      const ip = (interceptor as any).getClientIp(request)
      expect(ip).toBe(expected)
    })
  })
})
