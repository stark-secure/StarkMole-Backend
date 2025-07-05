import { validate } from "class-validator"
import { plainToClass } from "class-transformer"
import { GetAuditLogsDto } from "../audit-log.dto"

describe("GetAuditLogsDto", () => {
  it("should validate with default values", async () => {
    const dto = plainToClass(GetAuditLogsDto, {})
    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
    expect(dto.page).toBe(1)
    expect(dto.limit).toBe(50)
  })

  it("should validate with all valid fields", async () => {
    const dto = plainToClass(GetAuditLogsDto, {
      userId: "user-123",
      actionType: "USER_LOGIN",
      result: "SUCCESS",
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-01-02T00:00:00Z",
      page: 2,
      limit: 25,
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it("should fail validation for invalid page number", async () => {
    const dto = plainToClass(GetAuditLogsDto, {
      page: 0,
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe("page")
  })

  it("should fail validation for invalid limit", async () => {
    const dto = plainToClass(GetAuditLogsDto, {
      limit: 101,
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe("limit")
  })

  it("should fail validation for invalid result enum", async () => {
    const dto = plainToClass(GetAuditLogsDto, {
      result: "INVALID_STATUS",
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe("result")
  })

  it("should fail validation for invalid date format", async () => {
    const dto = plainToClass(GetAuditLogsDto, {
      startDate: "invalid-date",
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe("startDate")
  })
})
