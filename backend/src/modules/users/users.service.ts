import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(payload: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existing) {
      throw new ConflictException("Ja existe um usuario com este email.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    return this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }

  async update(id: string, payload: UpdateUserDto) {
    await this.ensureExists(id);

    if (payload.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: payload.email,
          id: { not: id }
        }
      });

      if (existing) {
        throw new ConflictException("Ja existe um usuario com este email.");
      }
    }

    const passwordHash = payload.password
      ? await bcrypt.hash(payload.password, 10)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role as Role | undefined,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    if (user._count.orders > 0) {
      throw new ConflictException(
        "Nao e possivel excluir um usuario que possui pedidos vinculados."
      );
    }

    return this.prisma.user.delete({
      where: { id }
    });
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }
  }
}
