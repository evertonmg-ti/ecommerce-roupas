import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { EmailService } from "../email/email.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { SettingsService } from "./settings.service";
import { TestEmailDto } from "./dto/test-email.dto";

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly emailService: EmailService
  ) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @RateLimit({ limit: 20, windowSec: 300, keyPrefix: "settings-update" })
  updateSettings(@Body() payload: UpdateSettingsDto) {
    return this.settingsService.updateSettings(payload);
  }

  @Patch("test-email")
  @RateLimit({ limit: 5, windowSec: 300, keyPrefix: "settings-test-email" })
  async sendTestEmail(@Body() payload: TestEmailDto) {
    const settings = await this.settingsService.getSettings();
    await this.emailService.sendTestEmail(settings, payload.to.trim().toLowerCase());

    return {
      success: true
    };
  }
}
