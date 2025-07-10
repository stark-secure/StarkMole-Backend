import { Module } from '@nestjs/common';
import { AuditModule } from './audit.module';
import { AuditLogController } from './controllers/audit-log.controller';

@Module({
  imports: [AuditModule],
  controllers: [AuditLogController],
})
export class AdminModule {}
