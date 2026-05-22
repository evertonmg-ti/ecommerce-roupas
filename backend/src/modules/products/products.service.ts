import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma, ProductStatus } from "@prisma/client";
import { EngagementService } from "../engagement/engagement.service";
import { PrismaService } from "../prisma/prisma.service";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { BulkUpdateProductStatusDto } from "./dto/bulk-update-product-status.dto";
import { ImportProductsDto } from "./dto/import-products.dto";
import { ImportStockDto } from "./dto/import-stock.dto";
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

  listActive(filters?: {
    search?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    availability?: string;
    saleOnly?: string;
  }) {
    const search = filters?.search?.trim();
    const category = filters?.category?.trim();
    const minPrice = this.parseOptionalNonNegativeNumber(filters?.minPrice);
    const maxPrice = this.parseOptionalNonNegativeNumber(filters?.maxPrice);
    const onlyAvailable = filters?.availability?.trim() === "in_stock";
    const saleOnly = filters?.saleOnly?.trim() === "true";
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(onlyAvailable ? { stock: { gt: 0 } } : {}),
      ...(saleOnly ? { compareAt: { not: null } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {})
            }
          }
        : {}),
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

  async importCatalog(payload: ImportProductsDto) {
    const rows = this.parseCatalogCsv(payload.csvContent);

    if (rows.length === 0) {
      throw new BadRequestException("Nenhuma linha valida foi encontrada para importar.");
    }

    const grouped = new Map<string, (typeof rows)[number][]>();

    for (const row of rows) {
      const key = row.slug;
      const current = grouped.get(key) ?? [];
      current.push(row);
      grouped.set(key, current);
    }

    const summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      categoriesCreated: 0,
      variantsImported: 0,
      errors: [] as string[]
    };

    for (const [slug, groupRows] of grouped.entries()) {
      try {
        const normalized = this.normalizeImportedProductGroup(groupRows);
        const categoryId = await this.resolveImportCategory(normalized, summary);
        const existing = await this.prisma.product.findUnique({
          where: { slug },
          include: { variants: true }
        });

        if (existing && !payload.overwriteExisting) {
          summary.skipped += 1;
          continue;
        }

        const basePayload: CreateProductDto = {
          name: normalized.name,
          slug: normalized.slug,
          description: normalized.description,
          price: normalized.price,
          costPrice: normalized.costPrice,
          compareAt: normalized.compareAt,
          stock: normalized.stock,
          status: normalized.status,
          imageUrl: normalized.imageUrl,
          categoryId,
          variants: normalized.variants
        };

        if (existing) {
          await this.update(existing.id, basePayload);
          summary.updated += 1;
        } else {
          await this.create(basePayload);
          summary.created += 1;
        }

        summary.variantsImported += normalized.variants?.length ?? 0;
      } catch (error) {
        summary.errors.push(
          `${slug}: ${error instanceof Error ? error.message : "erro desconhecido"}`
        );
      }
    }

    return summary;
  }

  async exportCatalogCsv() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const header = [
      "name",
      "slug",
      "description",
      "price",
      "costPrice",
      "compareAt",
      "stock",
      "status",
      "categorySlug",
      "categoryName",
      "imageUrl",
      "variantSku",
      "variantColor",
      "variantSize",
      "variantLabel",
      "variantPrice",
      "variantCompareAt",
      "variantStock",
      "variantImage",
      "variantIsDefault"
    ];

    const lines = [header.join(",")];

    for (const product of products) {
      if (product.variants.length === 0) {
        lines.push(
          this.toCsvLine([
            product.name,
            product.slug,
            product.description,
            Number(product.price).toFixed(2),
            Number(product.costPrice).toFixed(2),
            product.compareAt ? Number(product.compareAt).toFixed(2) : "",
            String(product.stock),
            product.status,
            product.category.slug,
            product.category.name,
            product.imageUrl ?? "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ])
        );
        continue;
      }

      for (const variant of product.variants) {
        lines.push(
          this.toCsvLine([
            product.name,
            product.slug,
            product.description,
            Number(product.price).toFixed(2),
            Number(product.costPrice).toFixed(2),
            product.compareAt ? Number(product.compareAt).toFixed(2) : "",
            String(product.stock),
            product.status,
            product.category.slug,
            product.category.name,
            product.imageUrl ?? "",
            variant.sku,
            variant.color ?? "",
            variant.size ?? "",
            variant.optionLabel,
            variant.priceOverride ? Number(variant.priceOverride).toFixed(2) : "",
            variant.compareAtOverride
              ? Number(variant.compareAtOverride).toFixed(2)
              : "",
            String(variant.stock),
            variant.imageUrl ?? "",
            variant.isDefault ? "true" : "false"
          ])
        );
      }
    }

    return {
      filename: "catalogo-produtos.csv",
      content: lines.join("\n")
    };
  }

  async exportStockCsv() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const header = [
      "productSlug",
      "productName",
      "categoryName",
      "variantSku",
      "variantLabel",
      "currentStock",
      "newStock",
      "quantityDelta",
      "reason"
    ];
    const lines = [header.join(",")];

    for (const product of products) {
      if (product.variants.length === 0) {
        lines.push(
          this.toCsvLine([
            product.slug,
            product.name,
            product.category.name,
            "",
            "",
            String(product.stock),
            "",
            "",
            ""
          ])
        );
        continue;
      }

      for (const variant of product.variants) {
        lines.push(
          this.toCsvLine([
            product.slug,
            product.name,
            product.category.name,
            variant.sku,
            variant.optionLabel,
            String(variant.stock),
            "",
            "",
            ""
          ])
        );
      }
    }

    return {
      filename: "estoque-produtos.csv",
      content: lines.join("\n")
    };
  }

  async importStockCsv(payload: ImportStockDto, actor?: AdminActor) {
    const rows = this.parseCatalogCsv(payload.csvContent);

    if (rows.length === 0) {
      throw new BadRequestException("Nenhuma linha valida foi encontrada para importar estoque.");
    }

    const summary = {
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const row of rows) {
      const productSlug = row.productSlug?.trim();
      const variantSku = row.variantSku?.trim();
      const reason = row.reason?.trim() || undefined;

      try {
        if (variantSku) {
          await this.importVariantStockRow(variantSku, row, reason, actor);
          summary.updated += 1;
          continue;
        }

        if (!productSlug) {
          summary.skipped += 1;
          continue;
        }

        await this.importProductStockRow(productSlug, row, reason, actor);
        summary.updated += 1;
      } catch (error) {
        summary.errors.push(
          `${variantSku || productSlug || "linha"}: ${
            error instanceof Error ? error.message : "erro desconhecido"
          }`
        );
      }
    }

    return summary;
  }

  async bulkUpdateStatus(payload: BulkUpdateProductStatusDto) {
    const ids = Array.from(
      new Set(payload.ids.map((id) => id.trim()).filter((id) => id.length > 0))
    );

    if (ids.length === 0) {
      throw new BadRequestException("Selecione ao menos um produto para a acao em lote.");
    }

    const result = await this.prisma.product.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        status: payload.status
      }
    });

    return {
      updatedCount: result.count
    };
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

  private parseCatalogCsv(csvContent: string) {
    const lines = csvContent
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) => header.trim());
    const rows: Array<Record<string, string>> = [];

    for (const line of lines.slice(1)) {
      const values = this.parseCsvLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? "";
      });

      if (row.slug || row.name) {
        rows.push(row);
      }
    }

    return rows;
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }

  private async importProductStockRow(
    productSlug: string,
    row: Record<string, string>,
    reason: string | undefined,
    actor?: AdminActor
  ) {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
      include: { variants: true }
    });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado para ajuste de estoque.");
    }

    if (product.variants.length > 0) {
      throw new BadRequestException(
        "Use variantSku para ajustar produtos com variacoes."
      );
    }

    const nextStock = this.resolveImportedStockTarget(row, product.stock);

    if (nextStock === product.stock) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: nextStock }
      });

      await this.recordInventoryMovement(tx, {
        productId: product.id,
        actorUserId: actor?.id,
        type: InventoryMovementType.MANUAL_ADJUSTMENT,
        quantityDelta: nextStock - product.stock,
        previousStock: product.stock,
        nextStock,
        reason: reason || "Importacao em lote de estoque."
      });
    });

    if (product.stock <= 0 && nextStock > 0) {
      await this.engagementService.notifyBackInStockIfNeeded(product.id);
    }
  }

  private async importVariantStockRow(
    variantSku: string,
    row: Record<string, string>,
    reason: string | undefined,
    actor?: AdminActor
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { sku: variantSku },
      include: {
        product: true
      }
    });

    if (!variant) {
      throw new NotFoundException("Variacao nao encontrada para ajuste de estoque.");
    }

    const nextVariantStock = this.resolveImportedStockTarget(row, variant.stock);

    if (nextVariantStock === variant.stock) {
      return;
    }

    const previousProductStock = variant.product.stock;
    const nextProductStock = previousProductStock - variant.stock + nextVariantStock;

    await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: nextVariantStock }
      });

      await tx.product.update({
        where: { id: variant.productId },
        data: { stock: nextProductStock }
      });

      await this.recordInventoryMovement(tx, {
        productId: variant.productId,
        actorUserId: actor?.id,
        type: InventoryMovementType.MANUAL_ADJUSTMENT,
        quantityDelta: nextProductStock - previousProductStock,
        previousStock: previousProductStock,
        nextStock: nextProductStock,
        reason:
          reason ||
          `Importacao em lote da variacao ${variant.sku} (${variant.optionLabel}).`
      });
    });

    if (previousProductStock <= 0 && nextProductStock > 0) {
      await this.engagementService.notifyBackInStockIfNeeded(variant.productId);
    }
  }

  private resolveImportedStockTarget(row: Record<string, string>, currentStock: number) {
    const hasNewStock = row.newStock?.trim();
    const hasDelta = row.quantityDelta?.trim();

    if (hasNewStock) {
      return this.parseImportInteger(row.newStock, "newStock");
    }

    if (hasDelta) {
      const delta = this.parseImportSignedInteger(row.quantityDelta, "quantityDelta");
      const nextStock = currentStock + delta;

      if (nextStock < 0) {
        throw new BadRequestException(
          "O ajuste importado deixaria o estoque negativo."
        );
      }

      return nextStock;
    }

    throw new BadRequestException(
      "Informe newStock ou quantityDelta na importacao de estoque."
    );
  }

  private normalizeImportedProductGroup(rows: Array<Record<string, string>>) {
    const first = rows[0];
    const slug = (first.slug || this.slugify(first.name)).trim();

    if (!first.name?.trim() || !slug) {
      throw new BadRequestException("Nome e slug sao obrigatorios na importacao.");
    }

    const variants = rows
      .filter((row) => row.variantSku?.trim() || row.variantLabel?.trim())
      .map((row, index) => ({
        sku: row.variantSku.trim(),
        color: row.variantColor?.trim() || undefined,
        size: row.variantSize?.trim() || undefined,
        optionLabel: (row.variantLabel || row.variantSku).trim(),
        priceOverride: row.variantPrice
          ? this.parseImportNumber(row.variantPrice, "variantPrice")
          : undefined,
        compareAtOverride: row.variantCompareAt
          ? this.parseImportNumber(row.variantCompareAt, "variantCompareAt")
          : undefined,
        stock: this.parseImportInteger(row.variantStock || "0", "variantStock"),
        imageUrl: row.variantImage?.trim() || undefined,
        isDefault:
          (row.variantIsDefault || "").toLowerCase() === "true" ||
          (row.variantIsDefault || "").toLowerCase() === "sim" ||
          index === 0
      }))
      .filter((variant) => variant.sku && variant.optionLabel);

    return {
      name: first.name.trim(),
      slug,
      description: first.description?.trim() || first.name.trim(),
      price: this.parseImportNumber(first.price || "0", "price"),
      costPrice: this.parseImportNumber(first.costPrice || "0", "costPrice"),
      compareAt: first.compareAt
        ? this.parseImportNumber(first.compareAt, "compareAt")
        : undefined,
      stock: variants.length
        ? variants.reduce((sum, variant) => sum + variant.stock, 0)
        : this.parseImportInteger(first.stock || "0", "stock"),
      status: this.parseImportStatus(first.status),
      imageUrl: first.imageUrl?.trim() || undefined,
      categorySlug: first.categorySlug?.trim() || this.slugify(first.categoryName || "colecao"),
      categoryName: first.categoryName?.trim() || "Colecao",
      variants
    };
  }

  private parseImportStatus(value?: string) {
    const normalized = value?.trim().toUpperCase();

    if (!normalized) {
      return ProductStatus.DRAFT;
    }

    if (Object.values(ProductStatus).includes(normalized as ProductStatus)) {
      return normalized as ProductStatus;
    }

    throw new BadRequestException(`Status invalido na importacao: ${value}.`);
  }

  private parseImportNumber(value: string, field: string) {
    const parsed = Number(value.replace(",", "."));

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`Campo ${field} invalido na importacao.`);
    }

    return parsed;
  }

  private parseImportInteger(value: string, field: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(`Campo ${field} invalido na importacao.`);
    }

    return parsed;
  }

  private parseImportSignedInteger(value: string, field: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`Campo ${field} invalido na importacao.`);
    }

    return parsed;
  }

  private async resolveImportCategory(
    product: { categorySlug: string; categoryName: string },
    summary: { categoriesCreated: number }
  ) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: product.categorySlug }
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.category.create({
      data: {
        name: product.categoryName,
        slug: product.categorySlug
      }
    });
    summary.categoriesCreated += 1;
    return created.id;
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private toCsvLine(values: string[]) {
    return values
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",");
  }

  private parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private parseOptionalNonNegativeNumber(value?: string) {
    if (!value?.trim()) {
      return undefined;
    }

    const parsed = Number(value.replace(",", "."));

    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined;
    }

    return parsed;
  }

  private resolvePublicSort(
    sort?: string
  ): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case "price_asc":
        return { price: "asc" };
      case "price_desc":
        return { price: "desc" };
      case "name_asc":
        return { name: "asc" };
      case "discount_desc":
        return [{ compareAt: "desc" }, { price: "asc" }];
      case "newest":
      default:
        return { createdAt: "desc" };
    }
  }
}
