import { Module } from "@nestjs/common"
import { AccessibilityService } from "./accessibility.service"
import { AccessibilityController } from "./accessibility.controller"
import { ConfigModule } from "@nestjs/config"

@Module({
  imports: [ConfigModule],
  providers: [AccessibilityService],
  controllers: [AccessibilityController],
  exports: [AccessibilityService],
})
export class AccessibilityModule {}
