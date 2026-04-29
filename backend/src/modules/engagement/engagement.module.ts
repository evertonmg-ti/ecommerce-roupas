import { Module } from "@nestjs/common";
import { EmailModule } from "../email/email.module";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";

@Module({
  imports: [EmailModule],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService]
})
export class EngagementModule {}
