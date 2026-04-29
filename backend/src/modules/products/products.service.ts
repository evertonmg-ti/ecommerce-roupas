import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma, ProductStatus } from "@prisma/client";
import { EngagementService } from "../engagement/engagement.service";
import { PrismaService } from "../prisma/prisma.service";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ValidateCartDto } from "./dto/validate-cart.dto";

type AdminActor = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementService: EngagementService
  ) {}

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
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
        }
      },
      orderBy: this.resolvePublicSort(filters?.sort)
    });
  }

  async listAll(filters?: {
    search?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 10), 50);
    const skip = (page - 1) * pageSize;
    const where = this.buildAdminProductWhere(filters?.search, filters?.status);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  async listInventoryMovements(filters?: {
    search?: string;
    type?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 20), 100);
    const skip = (page - 1) * pageSize;
    const where = this.buildInventoryMovementWhere(filters?.search, filters?.type);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            include: { category: true }
          },
          actorUser: true,
          order: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
        }
      }
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
      include: {
        category: true,
        variants: true
      }
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

      const matchedVariant = item.variantId
        ? product?.variants.find((variant) => variant.id === item.variantId)
        : undefined;
      const availableStock = matchedVariant?.stock ?? product?.stock ?? 0;
      const availablePrice = matchedVariant?.priceOverride ?? product?.price;

      if (item.variantId && !matchedVariant) {
        return {
          productId: item.productId,
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          available: false,
          status: "unavailable" as const,
          message: "A variacao selecionada nao esta mais disponivel."
        };
      }

      if (availableStock <= 0) {
        return {
          productId: product.id,
          variantId: matchedVariant?.id,
          requestedQuantity: item.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          available: false,
          status: "unavailable" as const,
          message: `${product.name} esta sem estoque no momento.`,
          product
        };
      }

      if (item.quantity > availableStock) {
        return {
          productId: product.id,
          variantId: matchedVariant?.id,
          requestedQuantity: item.quantity,
          adjustedQuantity: availableStock,
          availableStock,
          available: true,
          status: "adjusted" as const,
          message: `A quantidade de ${product.name} foi ajustada para ${availableStock}.`,
          product,
          variant: matchedVariant,
          price: Number(availablePrice)
        };
      }

      return {
        productId: product.id,
        variantId: matchedVariant?.id,
        requestedQuantity: item.quantity,
        adjustedQuantity: item.quantity,
        availableStock,
        available: true,
        status: "ok" as const,
        message: "Disponivel.",
        product,
        variant: matchedVariant,
        price: Number(availablePrice)
      };
    });

    const subtotal = items.reduce((sum, item) => {
      if (!item.available || !item.product) {
        return sum;
      }

      return sum + Number(item.price ?? item.product.price) * item.adjustedQuantity;
    }, 0);

    return {
      items,
      canCheckout: items.every((item) => item.available),
      subtotal
    };
  }

  async create(payload: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          price: new Prisma.Decimal(payload.price),
          costPrice: new Prisma.Decimal(payload.costPrice),
          compareAt:
            payload.compareAt === undefined
              ? undefined
              : new Prisma.Decimal(payload.compareAt),
          stock: payload.variants?.length
            ? payload.variants.reduce((sum, variant) => sum + variant.stock, 0)
            : payload.stock,
          categoryId: payload.categoryId,
          imageUrl: payload.imageUrl,
          status: payload.status,
          variants: payload.variants?.length
            ? {
                create: payload.variants.map((variant, index) => ({
                  sku: variant.sku.trim(),
                  color: variant.color?.trim() || undefined,
                  size: variant.size?.trim() || undefined,
                  optionLabel: variant.optionLabel.trim(),
                  priceOverride:
                    variant.priceOverride === undefined
                      ? undefined
                      : new Prisma.Decimal(variant.priceOverride),
                  compareAtOverride:
                    variant.compareAtOverride === undefined
                      ? undefined
                      : new Prisma.Decimal(variant.compareAtOverride),
                  stock: variant.stock,
                  imageUrl: variant.imageUrl?.trim() || undefined,
                  isDefault:
                    variant.isDefault === true ||
                    (index === 0 &&
                      !payload.variants?.some((item) => item.isDefault === true))
                }))
              }
            : undefined
        }
      });

      if (product.stock > 0) {
        await this.recordInventoryMovement(tx, {
          productId: product.id,
          type: InventoryMovementType.INITIAL,
          quantityDelta: product.stock,
          previousStock: 0,
          nextStock: product.stock,
          reason: "Cadastro inicial do produto."
        });
      }

      await this.engagementService.notifyBackInStockIfNeeded(product.id);

      return product;
    });
  }

  async update(id: string, payload: UpdateProductDto, actor?: AdminActor) {
    const existing = await this.ensureExists(id);

    return this.prisma.$transaction(async (tx) => {
      const normalizedVariants = payload.variants?.length
        ? payload.variants.map((variant, index) => ({
            sku: variant.sku.trim(),
            color: variant.color?.trim() || undefined,
            size: variant.size?.trim() || undefined,
            optionLabel: variant.optionLabel.trim(),
            priceOverride:
              variant.priceOverride === undefined
                ? undefined
                : new Prisma.Decimal(variant.priceOverride),
            compareAtOverride:
              variant.compareAtOverride === undefined
                ? undefined
                : new Prisma.Decimal(variant.compareAtOverride),
            stock: variant.stock,
            imageUrl: variant.imageUrl?.trim() || undefined,
            isDefault:
              variant.isDefault === true ||
              (index === 0 &&
                !payload.variants?.some((item) => item.isDefault === true))
          }))
        : undefined;
      const nextStock =
        normalizedVariants?.reduce((sum, variant) => sum + variant.stock, 0) ??
        payload.stock;
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          price:
            payload.price === undefined
              ? undefined
              : new Prisma.Decimal(payload.price),
          costPrice:
            payload.costPrice === undefined
              ? undefined
              : new Prisma.Decimal(payload.costPrice),
          compareAt:
            payload.compareAt === undefined
              ? undefined
              : new Prisma.Decimal(payload.compareAt),
          stock: nextStock,
          categoryId: payload.categoryId,
          imageUrl: payload.imageUrl,
          status: payload.status,
          variants:
            normalizedVariants !== undefined
              ? {
                  deleteMany: {},
                  create: normalizedVariants
                }
              : undefined
        }
      });

      if (
        nextStock !== undefined &&
        nextStock !== existing.stock
      ) {
        await this.recordInventoryMovement(tx, {
          productId: updated.id,
          actorUserId: actor?.id,
          type: InventoryMovementType.MANUAL_ADJUSTMENT,
          quantityDelta: nextStock - existing.stock,
          previousStock: existing.stock,
          nextStock,
          reason: "Ajuste via edicao do produto."
        });
      }

      if (existing.stock <= 0 && updated.stock > 0) {
        await this.engagementService.notifyBackInStockIfNeeded(updated.id);
      }

      return updated;
    });
  }

  async adjustStock(id: string, payload: AdjustStockDto, actor?: AdminActor) {
    const existing = await this.ensureExists(id);
    const quantityDelta = Math.trunc(payload.quantityDelta);

    if (quantityDelta === 0) {
      throw new BadRequestException("Informe um ajuste diferente de zero.");
    }

    const nextStock = existing.stock + quantityDelta;

    if (nextStock < 0) {
      throw new BadRequestException("O ajuste solicitado deixaria o estoque negativo.");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          stock: nextStock
        }
      });

      await this.recordInventoryMovement(tx, {
        productId: updated.id,
        actorUserId: actor?.id,
        type: InventoryMovementType.MANUAL_ADJUSTMENT,
        quantityDelta,
        previousStock: existing.stock,
        nextStock,
        reason: payload.reason?.trim() || "Ajuste manual realizado no painel."
      });

      if (existing.stock <= 0 && updated.stock > 0) {
        await this.engagementService.notifyBackInStockIfNeeded(updated.id);
      }

      return updated;
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async recordInventoryMovement(
    tx: Prisma.TransactionClient,
    input: {
      productId: string;
      orderId?: string;
      actorUserId?: string;
      type: InventoryMovementType;
      quantityDelta: number;
      previousStock: number;
      nextStock: number;
      reason?: string;
    }
  ) {
    if (input.quantityDelta === 0) {
      return null;
    }

    return tx.inventoryMovement.create({
      data: {
        productId: input.productId,
        orderId: input.orderId,
        actorUserId: input.actorUserId,
        type: input.type,
        quantityDelta: input.quantityDelta,
        previousStock: input.previousStock,
        nextStock: input.nextStock,
        reason: input.reason
      }
    });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true
      }
    });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    return product;
  }

  private normalizeCartItems(items: ValidateCartDto["items"]) {
    const grouped = new Map<string, { productId: string; variantId?: string; quantity: number }>();

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

  private buildAdminProductWhere(search?: string, status?: string) {
    const normalizedSearch = search?.trim();
    const normalizedStatus =
      status && Object.values(ProductStatus).includes(status as ProductStatus)
        ? (status as ProductStatus)
        : undefined;

    if (!normalizedSearch && !normalizedStatus) {
      return undefined;
    }

    return {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: "insensitive" as const
                }
              },
              {
                slug: {
                  contains: normalizedSearch,
                  mode: "insensitive" as const
                }
              },
              {
                category: {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const
                  }
                }
              }
            ]
          }
        : {})
    } satisfies Prisma.ProductWhereInput;
  }

  private buildInventoryMovementWhere(search?: string, type?: string) {
    const normalizedSearch = search?.trim();
    const normalizedType =
      type && Object.values(InventoryMovementType).includes(type as InventoryMovementType)
        ? (type as InventoryMovementType)
        : undefined;

    if (!normalizedSearch && !normalizedType) {
      return undefined;
    }

    return {
      ...(normalizedType ? { type: normalizedType } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                product: {
                  is: {
                    name: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const
                    }
                  }
                }
              },
              {
                product: {
                  is: {
                    slug: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const
                    }
                  }
                }
              },
              {
                order: {
                  is: {
                    id: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const
                    }
                  }
                }
              },
              {
                actorUser: {
                  is: {
                    email: {
                      contains: normalizedSearch,
                      mode: "insensitive" as const
                    }
                  }
                }
              },
              {
                reason: {
                  contains: normalizedSearch,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {})
    } satisfies Prisma.InventoryMovementWhereInput;
  }

  private parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
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
