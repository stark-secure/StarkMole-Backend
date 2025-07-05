import { AuditLog } from "../audit-log.entity"

describe("AuditLog Entity", () => {
  it("should create an audit log instance", () => {
    const auditLog = new AuditLog()

    auditLog.id = "123e4567-e89b-12d3-a456-426614174000"
    auditLog.userId = "user-123"
    auditLog.actionType = "USER_LOGIN"
    auditLog.metadata = { ip: "127.0.0.1" }
    auditLog.createdAt = new Date()
    auditLog.ipAddress = "127.0.0.1"
    auditLog.userAgent = "Mozilla/5.0"
    auditLog.resource = "auth"
    auditLog.result = "SUCCESS"

    expect(auditLog).toBeDefined()
    expect(auditLog.id).toBe("123e4567-e89b-12d3-a456-426614174000")
    expect(auditLog.userId).toBe("user-123")
    expect(auditLog.actionType).toBe("USER_LOGIN")
    expect(auditLog.metadata).toEqual({ ip: "127.0.0.1" })
    expect(auditLog.ipAddress).toBe("127.0.0.1")
    expect(auditLog.userAgent).toBe("Mozilla/5.0")
    expect(auditLog.resource).toBe("auth")
    expect(auditLog.result).toBe("SUCCESS")
  })

  it("should allow null values for optional fields", () => {
    const auditLog = new AuditLog()

    auditLog.userId = "user-123"
    auditLog.actionType = "USER_LOGIN"
    auditLog.createdAt = new Date()

    expect(auditLog.metadata).toBeUndefined()
    expect(auditLog.ipAddress).toBeUndefined()
    expect(auditLog.userAgent).toBeUndefined()
    expect(auditLog.resource).toBeUndefined()
    expect(auditLog.result).toBeUndefined()
  })
})
