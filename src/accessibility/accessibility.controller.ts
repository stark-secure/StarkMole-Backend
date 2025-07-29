import { Controller, Post, HttpCode, HttpStatus, Logger } from "@nestjs/common"
import type { AccessibilityService } from "./accessibility.service"
import { IsString, IsDateString, IsArray, IsOptional, IsNumber, ValidateNested, IsEnum } from "class-validator"
import { Type } from "class-transformer"

// DTO for AccessibilityIssue
class AccessibilityIssueDto {
  @IsString()
  code: string

  @IsString()
  message: string

  @IsString()
  path: string

  @IsEnum(["low", "medium", "high", "critical"])
  severity: "low" | "medium" | "high" | "critical"

  @IsOptional()
  @IsString({ each: true }) // Assuming context keys are strings
  context?: Record<string, any>
}

// DTO for AccessibilityReport
class AccessibilityReportDto {
  @IsString()
  reportId: string

  @IsDateString()
  timestamp: Date

  @IsString()
  url: string

  @IsString()
  tool: string

  @IsOptional()
  @IsNumber()
  score?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessibilityIssueDto)
  issues: AccessibilityIssueDto[]

  @IsOptional()
  @IsString({ each: true }) // Assuming metadata keys are strings
  metadata?: Record<string, any>
}

@Controller("accessibility")
export class AccessibilityController {
  private readonly logger = new Logger(AccessibilityController.name)

  constructor(private readonly accessibilityService: AccessibilityService) {}

  /**
   * Endpoint to receive and process accessibility reports from frontend tools.
   * This would typically be called by a CI/CD pipeline or a frontend application.
   * @param report The accessibility report data.
   */
  @Post("report")
  @HttpCode(HttpStatus.ACCEPTED)
  async receiveAccessibilityReport(report: AccessibilityReportDto): Promise<{ message: string }> {
    this.logger.log(`Received accessibility report for ${report.url}`)
    // In a real application, you would save this report to a database
    // or trigger further actions (e.g., notifications, dashboard updates).
    this.accessibilityService.processAccessibilityReport(report)
    return { message: "Accessibility report received and processed." }
  }

  // Example endpoint for backend data validation (conceptual)
  // This could be integrated into other controllers or services
  // to validate data before it's sent to the frontend.
  @Post("validate-image-data")
  @HttpCode(HttpStatus.OK)
  async validateImageData(imageData: { url: string; altText?: string }): Promise<{ issues: AccessibilityIssueDto[] }> {
    const issues = this.accessibilityService.validateImageAltText(imageData, "input.imageData")
    return { issues }
  }
}
