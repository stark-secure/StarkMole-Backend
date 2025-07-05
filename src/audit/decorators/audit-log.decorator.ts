import { SetMetadata } from "@nestjs/common"
import { AUDIT_LOG_KEY, type AuditLogMetadata } from "../interceptors/audit-log.interceptor"

export const AuditLog = (metadata: AuditLogMetadata) => SetMetadata(AUDIT_LOG_KEY, metadata)
