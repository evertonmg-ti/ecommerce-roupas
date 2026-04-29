import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  buildAdminOrderCreatedEmail,
  buildOrderCreatedEmail,
  buildOrderStatusEmail,
  OrderEmailPayload
} from "./order-email.templates";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly emailEnabled: boolean;
  private readonly emailFrom: string;
  private readonly emailReplyTo?: string;
  private readonly ordersInbox?: string;

  constructor(private readonly configService: ConfigService) {
    this.emailEnabled =
      this.configService.get<string>("EMAIL_ENABLED", "false") === "true";
    this.emailFrom = this.configService.get<string>(
      "EMAIL_FROM",
      "Maison Aurea <no-reply@maisonaurea.local>"
    );
    this.emailReplyTo = this.configService.get<string>("EMAIL_REPLY_TO");
    this.ordersInbox = this.configService.get<string>("EMAIL_ORDERS_TO");

    const host = this.configService.get<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT", "587"));
    const secure =
      this.configService.get<string>("SMTP_SECURE", "false") === "true";
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");

    if (this.emailEnabled && host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined
      });
    }
  }

  async sendOrderCreated(payload: OrderEmailPayload) {
    await this.safeSend(payload.customerEmail, buildOrderCreatedEmail(payload));

    if (this.ordersInbox) {
      await this.safeSend(this.ordersInbox, buildAdminOrderCreatedEmail(payload));
    }
  }

  async sendOrderStatusUpdated(payload: OrderEmailPayload) {
    await this.safeSend(payload.customerEmail, buildOrderStatusEmail(payload));
  }

  private async safeSend(
    to: string,
    message: { subject: string; text: string; html: string }
  ) {
    try {
      await this.send(to, message);
    } catch (error) {
      this.logger.error(
        `Falha ao enviar email para ${to}: ${error instanceof Error ? error.message : "erro desconhecido"}`
      );
    }
  }

  private async send(
    to: string,
    message: { subject: string; text: string; html: string }
  ) {
    if (!this.emailEnabled || !this.transporter) {
      this.logger.log(
        `Email transacional (modo log) para ${to} | ${message.subject}\n${message.text}`
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.emailFrom,
      replyTo: this.emailReplyTo,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
  }
}
