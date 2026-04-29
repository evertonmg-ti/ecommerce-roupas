import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { SaveCurrentUserCartDto } from "./dto/save-current-user-cart.dto";
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

  async getCurrentUserCart(userId: string) {
    await this.ensureExists(userId);

    const cart = await this.prisma.savedCart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              include: {
                category: true
              }
            },
            variant: true
          }
        }
      }
    });

    return {
      items:
        cart?.items
          .filter((item) => item.product.status !== ProductStatus.ARCHIVED)
          .map((item) => ({
            id: item.variant?.id ?? item.product.id,
            productId: item.product.id,
            variantId: item.variant?.id ?? undefined,
            sku: item.variant?.sku ?? undefined,
            variantLabel: item.variant?.optionLabel ?? undefined,
            name: item.product.name,
            slug: item.product.slug,
            price: Number(item.variant?.priceOverride ?? item.product.price),
            imageUrl: item.variant?.imageUrl ?? item.product.imageUrl ?? undefined,
            category: item.product.category.name,
            stock: item.variant?.stock ?? item.product.stock,
            quantity: item.quantity
          })) ?? [],
      updatedAt: cart?.updatedAt ?? null
    };
  }

  async replaceCurrentUserCart(userId: string, payload: SaveCurrentUserCartDto) {
    await this.ensureExists(userId);

    const normalizedItems = this.normalizeCartItems(payload.items);
    const productIds = normalizedItems.map((item) => item.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: {
            id: { in: productIds }
          },
          include: {
            variants: true
          }
        })
      : [];
    const productMap = new Map(products.map((product) => [product.id, product]));
    const validItems = normalizedItems.filter((item) => {
      const product = productMap.get(item.productId);

      if (!product || product.status === ProductStatus.ARCHIVED) {
        return false;
      }

      if (!item.variantId) {
        return true;
      }

      return product.variants.some((variant) => variant.id === item.variantId);
    });

    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.savedCart.upsert({
        where: { userId },
        update: {},
        create: { userId }
      });

      await tx.savedCartItem.deleteMany({
        where: { cartId: cart.id }
      });

      if (validItems.length > 0) {
        await tx.savedCartItem.createMany({
          data: validItems.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity
          }))
        });
      }
    });

    return this.getCurrentUserCart(userId);
  }

  async clearCurrentUserCart(userId: string) {
    await this.ensureExists(userId);

    const cart = await this.prisma.savedCart.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!cart) {
      return { success: true };
    }

    await this.prisma.savedCartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return { success: true };
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

  private normalizeCartItems(items: SaveCurrentUserCartDto["items"]) {
    const grouped = new Map<
      string,
      { productId: string; variantId?: string; quantity: number }
    >();

    for (const item of items) {
      const productId = item.productId.trim();
      const variantId = item.variantId?.trim() || undefined;
      const quantity = Math.trunc(Number(item.quantity));

      if (!productId || !Number.isFinite(quantity) || quantity < 1) {
        continue;
      }

      const key = `${productId}:${variantId ?? "base"}`;
      const current = grouped.get(key);

      grouped.set(key, {
        productId,
        variantId,
        quantity: (current?.quantity ?? 0) + quantity
      });
    }

    return Array.from(grouped.values());
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
