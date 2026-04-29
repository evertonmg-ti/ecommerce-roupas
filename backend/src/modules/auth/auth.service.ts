import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EventLevel, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { EmailService } from "../email/email.service";
import { ObservabilityService } from "../observability/observability.service";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly settingsService: SettingsService,
    private readonly observabilityService: ObservabilityService
  ) {}

  async register(payload: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existing) {
      await this.observabilityService.logEvent({
        type: "security.register_conflict",
        source: "auth",
        level: EventLevel.SECURITY,
        message: `Tentativa de cadastro com email ja existente: ${payload.email}.`,
        metadata: {
          email: payload.email
        }
      });
      throw new ConflictException("Email ja cadastrado.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: Role.CUSTOMER
      }
    });

    return this.buildAuthResponse(user);
  }

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      await this.observabilityService.logEvent({
        type: "security.login_failed",
        source: "auth",
        level: EventLevel.SECURITY,
        message: `Falha de login para ${payload.email}.`,
        metadata: {
          email: payload.email,
          reason: "user_not_found"
        }
      });
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValid) {
      await this.observabilityService.logEvent({
        type: "security.login_failed",
        source: "auth",
        level: EventLevel.SECURITY,
        message: `Falha de login para ${payload.email}.`,
        metadata: {
          userId: user.id,
          email: payload.email,
          reason: "invalid_password"
        }
      });
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    await this.observabilityService.logEvent({
      type: "auth.login_succeeded",
      source: "auth",
      level: EventLevel.INFO,
      message: `Login concluido para ${user.email}.`,
      metadata: {
        userId: user.id,
        email: user.email,
        role: user.role
      }
    });

    return this.buildAuthResponse(user);
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.trim().toLowerCase() }
    });

    if (!user) {
      return { success: true };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    const settings = await this.settingsService.getSettings();
    const baseUrl = settings.storeUrl.replace(/\/+$/, "");
    const resetUrl = `${baseUrl}/resetar-senha?token=${encodeURIComponent(rawToken)}`;

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      customerName: user.name,
      resetUrl,
      expiresAt
    });
    await this.observabilityService.logEvent({
      type: "auth.password_reset_requested",
      source: "auth",
      level: EventLevel.SECURITY,
      message: `Solicitacao de recuperacao de senha para ${user.email}.`,
      metadata: {
        userId: user.id,
        email: user.email
      }
    });

    return { success: true };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(payload.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      await this.observabilityService.logEvent({
        type: "security.password_reset_invalid_token",
        source: "auth",
        level: EventLevel.SECURITY,
        message: "Tentativa de redefinicao com token invalido ou expirado."
      });
      throw new BadRequestException("Token invalido ou expirado.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      })
    ]);

    await this.observabilityService.logEvent({
      type: "auth.password_reset_completed",
      source: "auth",
      level: EventLevel.SECURITY,
      message: `Senha redefinida para ${record.user.email}.`,
      metadata: {
        userId: record.user.id,
        email: record.user.email
      }
    });

    return { success: true };
  }

  async getCurrentUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedException("Sessao invalida.");
    }

    return user;
  }

  private buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  }) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role
      })
    };
  }

  private hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
