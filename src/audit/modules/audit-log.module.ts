import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuditLog } from "../entities/audit-log.entity"
import { AuditLogService } from "../services/audit-log.service"
import { AuditLogInterceptor } from "../interceptors/audit-log.interceptor"

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService, AuditLogInterceptor],
  exports: [AuditLogService, AuditLogInterceptor],
})
export class AuditLogModule {}
