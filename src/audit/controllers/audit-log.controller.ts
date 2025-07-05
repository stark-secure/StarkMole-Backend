import { Controller, Get, Param, HttpStatus, HttpCode } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import type { AuditLogService } from "../../common/services/audit-log.service"
import {
  type GetAuditLogsDto,
  AuditLogsResponseDto,
  AuditLogResponseDto,
  AuditLogStatsDto,
} from "../../common/dto/audit-log.dto"

// Assuming you have these guards
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags("Admin - Audit Logs")
@Controller("admin/audit-logs")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: "Get audit logs with filtering" })
  @ApiResponse({
    status: 200,
    description: "Audit logs retrieved successfully",
    type: AuditLogsResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(query: GetAuditLogsDto): Promise<AuditLogsResponseDto> {
    const filters = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }

    return this.auditLogService.findLogs(filters)
  }

  @Get("stats")
  @ApiOperation({ summary: "Get audit log statistics" })
  @ApiResponse({
    status: 200,
    description: "Audit log statistics retrieved successfully",
    type: AuditLogStatsDto,
  })
  @HttpCode(HttpStatus.OK)
  async getAuditLogStats(): Promise<AuditLogStatsDto> {
    return this.auditLogService.getLogStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific audit log by ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    type: AuditLogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Audit log not found',
  })
  @HttpCode(HttpStatus.OK)
  async getAuditLogById(@Param('id') id: string): Promise<AuditLogResponseDto> {
    const log = await this.auditLogService.getLogById(id);
    
    if (!log) {
      throw new Error('Audit log not found');
    }

    return log;
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get audit logs for specific user" })
  @ApiResponse({
    status: 200,
    description: "User audit logs retrieved successfully",
    type: [AuditLogResponseDto],
  })
  @HttpCode(HttpStatus.OK)
  async getUserAuditLogs(@Param('userId') userId: string, limit = 100): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.getLogsByUser(userId, limit)
  }

  @Get("action/:actionType")
  @ApiOperation({ summary: "Get audit logs by action type" })
  @ApiResponse({
    status: 200,
    description: "Action audit logs retrieved successfully",
    type: [AuditLogResponseDto],
  })
  @HttpCode(HttpStatus.OK)
  async getActionAuditLogs(@Param('actionType') actionType: string, limit = 100): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.getLogsByActionType(actionType, limit)
  }
}
