import { Global, Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { RateLimitGuard } from "../../common/guards/rate-limit.guard";
import { ObservabilityController } from "./observability.controller";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";
import { ObservabilityService } from "./observability.service";

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminAuditInterceptor
    }
  ],
  exports: [ObservabilityService]
})
export class ObservabilityModule {}
