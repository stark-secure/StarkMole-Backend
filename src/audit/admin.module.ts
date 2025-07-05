import { Module } from "@nestjs/common"
import { AuditLogModule } from "../common/modules/audit-log.module"
import { AuditLogController } from "./controllers/audit-log.controller"

@Module({
  imports: [AuditLogModule],
  controllers: [AuditLogController],
})
export class AdminModule {}
