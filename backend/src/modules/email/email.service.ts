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

  async sendPasswordResetEmail(payload: {
    to: string;
    customerName: string;
    resetUrl: string;
    expiresAt: Date;
  }) {
    const settings = await this.settingsService.getSettings();
    const subject = "Recuperacao de senha";
    const text = [
      `Ola, ${payload.customerName}.`,
      "",
      "Recebemos uma solicitacao para redefinir sua senha.",
      `Use o link abaixo ate ${payload.expiresAt.toLocaleString("pt-BR")}:`,
      payload.resetUrl
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;color:#2d241d;line-height:1.6;">
        <h2>Recuperacao de senha</h2>
        <p>Ola, <strong>${payload.customerName}</strong>.</p>
        <p>Recebemos uma solicitacao para redefinir sua senha.</p>
        <p>Use o link abaixo ate ${payload.expiresAt.toLocaleString("pt-BR")}:</p>
        <p><a href="${payload.resetUrl}">Redefinir senha</a></p>
      </div>
    `;

    await this.safeSend(settings, payload.to, { subject, text, html });
  }

  async sendTestEmail(
    settings: Awaited<ReturnType<SettingsService["getSettings"]>>,
    to: string
  ) {
    const subject = "Teste de email transacional";
    const text = [
      `Teste de configuracao SMTP da loja ${settings.storeName}.`,
      `URL da loja: ${settings.storeUrl}`,
      "Se voce recebeu esta mensagem, o envio transacional esta funcionando."
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;color:#2d241d;line-height:1.6;">
        <h2>Teste de email transacional</h2>
        <p>Loja: <strong>${settings.storeName}</strong></p>
        <p>URL: ${settings.storeUrl}</p>
        <p>Se voce recebeu esta mensagem, o envio transacional esta funcionando.</p>
      </div>
    `;

    await this.send(settings, to, { subject, text, html });
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
