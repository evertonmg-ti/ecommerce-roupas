import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { SettingsService } from "../settings/settings.service";
import {
  buildAdminOrderCreatedEmail,
  buildOrderCreatedEmail,
  buildOrderStatusEmail,
  OrderEmailPayload
} from "./order-email.templates";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly settingsService: SettingsService) {}

  async sendOrderCreated(payload: OrderEmailPayload) {
    const settings = await this.settingsService.getSettings();
    const messagePayload = {
      ...payload,
      storeUrl: settings.storeUrl
    };
    await this.safeSend(
      settings,
      payload.customerEmail,
      buildOrderCreatedEmail(messagePayload)
    );

    if (settings.emailOrdersTo) {
      await this.safeSend(
        settings,
        settings.emailOrdersTo,
        buildAdminOrderCreatedEmail(messagePayload)
      );
    }
  }

  async sendOrderStatusUpdated(payload: OrderEmailPayload) {
    const settings = await this.settingsService.getSettings();

    await this.safeSend(
      settings,
      payload.customerEmail,
      buildOrderStatusEmail({
        ...payload,
        storeUrl: settings.storeUrl
      })
    );
  }

  private async safeSend(
    settings: Awaited<ReturnType<SettingsService["getSettings"]>>,
    to: string,
    message: { subject: string; text: string; html: string }
  ) {
    try {
      await this.send(settings, to, message);
    } catch (error) {
      this.logger.error(
        `Falha ao enviar email para ${to}: ${error instanceof Error ? error.message : "erro desconhecido"}`
      );
    }
  }

  private async send(
    settings: Awaited<ReturnType<SettingsService["getSettings"]>>,
    to: string,
    message: { subject: string; text: string; html: string }
  ) {
    const transporter = this.buildTransporter(settings);

    if (!settings.emailEnabled || !transporter) {
      this.logger.log(
        `Email transacional (modo log) para ${to} | ${message.subject}\n${message.text}`
      );
      return;
    }

    await transporter.sendMail({
      from: settings.emailFrom,
      replyTo: settings.emailReplyTo ?? undefined,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
  }

  private buildTransporter(
    settings: Awaited<ReturnType<SettingsService["getSettings"]>>
  ): Transporter<SMTPTransport.SentMessageInfo> | undefined {
    if (!settings.smtpHost) {
      return undefined;
    }

    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: settings.smtpUser
        ? {
            user: settings.smtpUser,
            pass: settings.smtpPass ?? undefined
          }
        : undefined
    });
  }
}
