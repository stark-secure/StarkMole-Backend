import { Controller, Get } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { HealthCheck, type HealthCheckService, type TypeOrmHealthIndicator } from "@nestjs/terminus"

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Health check",
    description: "Performs a comprehensive health check of the application and its dependencies",
  })
  @ApiResponse({
    status: 200,
    description: "Application is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        info: {
          type: "object",
          properties: {
            database: {
              type: "object",
              properties: {
                status: { type: "string", example: "up" },
              },
            },
          },
        },
        error: { type: "object" },
        details: {
          type: "object",
          properties: {
            database: {
              type: "object",
              properties: {
                status: { type: "string", example: "up" },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Application is unhealthy",
  })
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck("database")])
  }
}
