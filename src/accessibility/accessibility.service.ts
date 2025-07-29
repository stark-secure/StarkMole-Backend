import { Injectable, Logger } from "@nestjs/common"
import type {
  AccessibilityIssue,
  ImageWithAltText,
  SemanticContent,
  AccessibilityReport,
} from "./interfaces/accessibility.interface"

@Injectable()
export class AccessibilityService {
  private readonly logger = new Logger(AccessibilityService.name)

  /**
   * Validates if an image object has appropriate alt text.
   * @param image The image object to validate.
   * @param path The path to the image in the data structure for reporting.
   * @returns An array of AccessibilityIssue if issues are found, otherwise empty.
   */
  validateImageAltText(image: ImageWithAltText, path: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    if (!image.url) {
      issues.push({
        code: "IMAGE_MISSING_URL",
        message: "Image object is missing a URL.",
        path: `${path}.url`,
        severity: "critical",
      })
    }

    // Check for missing or empty altText
    if (!image.altText || image.altText.trim() === "") {
      issues.push({
        code: "MISSING_ALT_TEXT",
        message: "Image is missing descriptive alt text.",
        path: `${path}.altText`,
        severity: "high",
        context: { url: image.url },
      })
    } else if (image.altText.length < 5) {
      // Example: Check for very short alt text that might not be descriptive
      issues.push({
        code: "SHORT_ALT_TEXT",
        message: "Alt text is too short and may not be descriptive enough.",
        path: `${path}.altText`,
        severity: "low",
        context: { url: image.url, altText: image.altText },
      })
    }

    return issues
  }

  /**
   * Validates semantic content for basic accessibility principles.
   * @param content The semantic content object to validate.
   * @param path The path to the content in the data structure for reporting.
   * @returns An array of AccessibilityIssue if issues are found, otherwise empty.
   */
  validateSemanticContent(content: SemanticContent, path: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    if (!content.content || content.content.trim() === "") {
      issues.push({
        code: "EMPTY_CONTENT",
        message: `Content of type '${content.type}' is empty.`,
        path: `${path}.content`,
        severity: "medium",
      })
    }

    if (content.type === "heading" && (!content.level || content.level < 1 || content.level > 6)) {
      issues.push({
        code: "INVALID_HEADING_LEVEL",
        message: "Heading element has an invalid or missing level.",
        path: `${path}.level`,
        severity: "medium",
        context: { content: content.content, level: content.level },
      })
    }

    if ((content.type === "button" || content.type === "link") && !content.ariaLabel && content.content.trim() === "") {
      issues.push({
        code: "INTERACTIVE_ELEMENT_MISSING_LABEL",
        message: `Interactive element of type '${content.type}' is missing a visible label or aria-label.`,
        path: `${path}.content`,
        severity: "high",
        context: { content: content.content },
      })
    }

    return issues
  }

  /**
   * Processes an incoming accessibility report (e.g., from a frontend CI/CD pipeline).
   * In a real application, this might store the report in a database,
   * trigger notifications, or update a dashboard.
   * @param report The accessibility report to process.
   */
  processAccessibilityReport(report: AccessibilityReport): void {
    this.logger.log(`Received accessibility report for URL: ${report.url} from tool: ${report.tool}`)
    this.logger.log(`Report ID: ${report.reportId}, Issues found: ${report.issues.length}`)

    if (report.score !== undefined) {
      this.logger.log(`Overall Accessibility Score: ${report.score}`)
    }

    report.issues.forEach((issue) => {
      this.logger.warn(
        `[${issue.severity.toUpperCase()}] Issue: ${issue.message} (Code: ${issue.code}, Path: ${issue.path})`,
      )
    })

    // Example: Store report in a database (conceptual)
    // this.reportRepository.save(report);
    // Example: Trigger a notification if critical issues are found
    // if (report.issues.some(issue => issue.severity === 'critical')) {
    //   this.notificationService.sendAlert('Critical accessibility issues found!');
    // }
  }

  /**
   * Provides a summary of common WCAG 2.1 guidelines relevant to backend data.
   * This can be used for documentation or internal reference.
   */
  getWCAGGuidelinesSummary(): string {
    return `
      WCAG 2.1 Guidelines Summary (Backend Relevance):
      1. Perceivable:
         - Provide text alternatives for non-text content (e.g., alt text for images).
         - Provide captions and other alternatives for multimedia.
         - Create content that can be presented in different ways (e.g., simple layout).
         - Make it easier for users to see and hear content (e.g., sufficient color contrast, though primarily frontend).
      2. Operable:
         - Make all functionality available from a keyboard (primarily frontend, but backend APIs should support keyboard-driven actions).
         - Provide enough time for users to read and use content.
         - Do not design content in a way that is known to cause seizures.
         - Provide ways to help users navigate, find content, and determine where they are (e.g., consistent API endpoints, clear data structures).
      3. Understandable:
         - Make text content readable and understandable.
         - Make Web pages appear and operate in predictable ways (consistent API responses).
         - Help users avoid and correct mistakes (clear error messages from backend).
      4. Robust:
         - Maximize compatibility with current and future user agents, including assistive technologies (well-formed API responses, standard data formats).
    `
  }
}
