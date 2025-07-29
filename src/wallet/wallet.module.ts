import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { WalletService } from "./wallet.service"
import { WalletController } from "./wallet.controller"
import { ArgentXProvider } from "./providers/argentx.provider"
import { BraavosProvider } from "./providers/braavos.provider"

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(), // For emitting wallet events
  ],
  providers: [WalletService, ArgentXProvider, BraavosProvider],
  controllers: [WalletController],
  exports: [WalletService], // Export WalletService for use in other modules
})
export class WalletModule {}
