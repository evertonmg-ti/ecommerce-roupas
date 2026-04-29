import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async getSettings() {
    return this.prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: this.buildDefaultSettings()
    });
  }

  async updateSettings(payload: UpdateSettingsDto) {
    await this.getSettings();

    return this.prisma.appSettings.update({
      where: { id: 1 },
      data: {
        ...payload,
        storeName: payload.storeName?.trim(),
        storeUrl: payload.storeUrl?.trim(),
        supportEmail: payload.supportEmail?.trim(),
        monthlyRevenueTarget:
          payload.monthlyRevenueTarget === undefined
            ? undefined
            : new Prisma.Decimal(payload.monthlyRevenueTarget),
        minimumMarginTarget: payload.minimumMarginTarget,
        emailFrom: payload.emailFrom?.trim(),
        emailReplyTo: payload.emailReplyTo?.trim(),
        emailOrdersTo: payload.emailOrdersTo?.trim(),
        smtpHost: payload.smtpHost?.trim(),
        smtpUser: payload.smtpUser?.trim(),
        smtpPass: payload.smtpPass?.trim()
      }
    });
  }

  private buildDefaultSettings() {
    return {
      storeName: this.configService.get<string>("STORE_NAME", "Maison Aurea"),
      storeUrl: this.configService.get<string>("STORE_URL", "http://localhost:3000"),
      supportEmail: this.configService.get<string>("SUPPORT_EMAIL") || undefined,
      monthlyRevenueTarget: Number(
        this.configService.get<string>("MONTHLY_REVENUE_TARGET", "0")
      ),
      minimumMarginTarget: Number(
        this.configService.get<string>("MINIMUM_MARGIN_TARGET", "25")
      ),
      emailEnabled:
        this.configService.get<string>("EMAIL_ENABLED", "false") === "true",
      emailFrom: this.configService.get<string>(
        "EMAIL_FROM",
        "Maison Aurea <no-reply@maisonaurea.local>"
      ),
      emailReplyTo: this.configService.get<string>("EMAIL_REPLY_TO") || undefined,
      emailOrdersTo: this.configService.get<string>("EMAIL_ORDERS_TO") || undefined,
      smtpHost: this.configService.get<string>("SMTP_HOST") || undefined,
      smtpPort: Number(this.configService.get<string>("SMTP_PORT", "587")),
      smtpSecure:
        this.configService.get<string>("SMTP_SECURE", "false") === "true",
      smtpUser: this.configService.get<string>("SMTP_USER") || undefined,
      smtpPass: this.configService.get<string>("SMTP_PASS") || undefined
    };
  }
}
