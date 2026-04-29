import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ValidateCartDto } from "./dto/validate-cart.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive(filters?: { search?: string; category?: string; sort?: string }) {
    const search = filters?.search?.trim();
    const category = filters?.category?.trim();
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(category
        ? {
            category: {
              slug: category
            }
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    };

    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: this.resolvePublicSort(filters?.sort)
    });
  }

  listAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true }
    });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    return product;
  }

  async checkAvailability(payload: ValidateCartDto) {
    const normalizedItems = this.normalizeCartItems(payload.items);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: normalizedItems.map((item) => item.productId) },
        status: ProductStatus.ACTIVE
      },
      include: { category: true }
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        return {
          productId: item.productId,
          requestedQuantity: item.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          available: false,
          status: "unavailable" as const,
          message: "Produto indisponivel no momento."
        };
      }

      if (product.stock <= 0) {
        return {
          productId: product.id,
          requestedQuantity: item.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          available: false,
          status: "unavailable" as const,
          message: `${product.name} esta sem estoque no momento.`,
          product
        };
      }

      if (item.quantity > product.stock) {
        return {
          productId: product.id,
          requestedQuantity: item.quantity,
          adjustedQuantity: product.stock,
          availableStock: product.stock,
          available: true,
          status: "adjusted" as const,
          message: `A quantidade de ${product.name} foi ajustada para ${product.stock}.`,
          product
        };
      }

      return {
        productId: product.id,
        requestedQuantity: item.quantity,
        adjustedQuantity: item.quantity,
        availableStock: product.stock,
        available: true,
        status: "ok" as const,
        message: "Disponivel.",
        product
      };
    });

    const subtotal = items.reduce((sum, item) => {
      if (!item.available || !item.product) {
        return sum;
      }

      return sum + Number(item.product.price) * item.adjustedQuantity;
    }, 0);

    return {
      items,
      canCheckout: items.every((item) => item.available),
      subtotal
    };
  }

  create(payload: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...payload,
        price: new Prisma.Decimal(payload.price),
        compareAt:
          payload.compareAt === undefined
            ? undefined
            : new Prisma.Decimal(payload.compareAt)
      }
    });
  }

  async update(id: string, payload: UpdateProductDto) {
    await this.ensureExists(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...payload,
        price:
          payload.price === undefined
            ? undefined
            : new Prisma.Decimal(payload.price),
        compareAt:
          payload.compareAt === undefined
            ? undefined
            : new Prisma.Decimal(payload.compareAt)
      }
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.product.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }
  }

  private normalizeCartItems(items: ValidateCartDto["items"]) {
    const grouped = new Map<string, number>();

    for (const item of items) {
      const productId = item.productId.trim();
      const quantity = Math.trunc(Number(item.quantity));

      if (!productId || !Number.isFinite(quantity) || quantity < 1) {
        continue;
      }

      grouped.set(productId, (grouped.get(productId) ?? 0) + quantity);
    }

    return Array.from(grouped.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));
  }

  private resolvePublicSort(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "name_asc":
        return { name: "asc" };
      case "newest":
      default:
        return { createdAt: "desc" };
    }
  }
}
