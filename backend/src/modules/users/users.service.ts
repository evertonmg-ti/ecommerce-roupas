import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { SaveCustomerAddressDto } from "./dto/save-customer-address.dto";
import { UpdateCurrentUserDto } from "./dto/update-current-user.dto";
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

  async getCurrentUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
        }
      }
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    return user;
  }

  async updateCurrentUser(id: string, payload: UpdateCurrentUserDto) {
    const current = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!current) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

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

    return this.prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash: payload.password
          ? await bcrypt.hash(payload.password, 10)
          : undefined
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

  async listCurrentUserAddresses(userId: string) {
    return this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
  }

  async createCurrentUserAddress(userId: string, payload: SaveCustomerAddressDto) {
    await this.ensureExists(userId);

    return this.prisma.$transaction(async (tx) => {
      if (payload.isDefault) {
        await tx.customerAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });
      }

      const hasAddress = await tx.customerAddress.count({
        where: { userId }
      });

      return tx.customerAddress.create({
        data: {
          userId,
          ...this.normalizeAddressPayload(payload, payload.isDefault || hasAddress === 0)
        }
      });
    });
  }

  async updateCurrentUserAddress(
    userId: string,
    addressId: string,
    payload: SaveCustomerAddressDto
  ) {
    const currentAddress = await this.ensureAddressBelongsToUser(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      if (payload.isDefault) {
        await tx.customerAddress.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: addressId }
          },
          data: { isDefault: false }
        });
      }

      const updatedAddress = await tx.customerAddress.update({
        where: { id: addressId },
        data: this.normalizeAddressPayload(payload, payload.isDefault)
      });

      if (currentAddress.isDefault && !payload.isDefault) {
        const defaultCount = await tx.customerAddress.count({
          where: {
            userId,
            isDefault: true
          }
        });

        if (defaultCount === 0) {
          return tx.customerAddress.update({
            where: { id: addressId },
            data: { isDefault: true }
          });
        }
      }

      return updatedAddress;
    });
  }

  async removeCurrentUserAddress(userId: string, addressId: string) {
    const address = await this.ensureAddressBelongsToUser(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.delete({
        where: { id: addressId }
      });

      if (address.isDefault) {
        const nextAddress = await tx.customerAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" }
        });

        if (nextAddress) {
          await tx.customerAddress.update({
            where: { id: nextAddress.id },
            data: { isDefault: true }
          });
        }
      }
    });

    return { success: true };
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

  private async ensureAddressBelongsToUser(userId: string, addressId: string) {
    const address = await this.prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        userId
      }
    });

    if (!address) {
      throw new NotFoundException("Endereco nao encontrado.");
    }

    return address;
  }

  private normalizeAddressPayload(payload: SaveCustomerAddressDto, isDefault?: boolean) {
    return {
      label: payload.label.trim(),
      recipientName: payload.recipientName.trim(),
      customerDocument: payload.customerDocument?.trim() || undefined,
      customerPhone: payload.customerPhone?.trim() || undefined,
      shippingAddress: payload.shippingAddress.trim(),
      shippingNumber: payload.shippingNumber.trim(),
      shippingAddress2: payload.shippingAddress2?.trim() || undefined,
      shippingNeighborhood: payload.shippingNeighborhood.trim(),
      shippingCity: payload.shippingCity.trim(),
      shippingState: payload.shippingState.trim().toUpperCase(),
      shippingPostalCode: payload.shippingPostalCode.trim(),
      isDefault: Boolean(isDefault)
    };
  }
}
