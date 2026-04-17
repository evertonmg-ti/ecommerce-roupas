import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(payload: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existing) {
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
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    return this.buildAuthResponse(user);
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
}
