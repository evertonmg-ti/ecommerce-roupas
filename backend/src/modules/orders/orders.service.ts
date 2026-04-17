import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  ProductStatus,
  Role,
  ShippingMethod
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { CouponsService } from "../coupons/coupons.service";
import { PrismaService } from "../prisma/prisma.service";
import { CalculateShippingDto } from "./dto/calculate-shipping.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService
  ) {}

  listAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listByCustomerEmail(payload: LookupOrdersDto) {
    return this.prisma.order.findMany({
      where: {
        user: {
          email: payload.email.trim().toLowerCase()
        }
      },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  calculateShipping(payload: CalculateShippingDto) {
    const sanitizedPostalCode = this.sanitizePostalCode(payload.postalCode);
    const subtotal = new Prisma.Decimal(payload.subtotal ?? 0);
    const quote = this.resolveShippingQuote(
      payload.shippingMethod,
      sanitizedPostalCode,
      subtotal
    );

    return {
      shippingMethod: payload.shippingMethod,
      postalCode: sanitizedPostalCode,
      shippingCost: quote.cost.toNumber(),
      estimatedDays: quote.estimatedDays,
      regionLabel: quote.regionLabel,
      freeShippingApplied: quote.freeShippingApplied
    };
  }

  async create(payload: CreateOrderDto) {
    const normalizedItems = this.normalizeItems(payload.items);
    const productIds = normalizedItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: ProductStatus.ACTIVE
      }
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException("Um ou mais produtos nao foram encontrados.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const items = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new NotFoundException("Produto nao encontrado.");
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${product.name}.`
        );
      }

      return {
        product,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(product.price)
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
      new Prisma.Decimal(0)
    );
    const shippingQuote = this.resolveShippingQuote(
      payload.shippingMethod,
      payload.shippingPostalCode,
      subtotal
    );
    const shippingCost = shippingQuote.cost;
    const couponApplication = await this.couponsService.resolveForOrder(
      payload.couponCode,
      subtotal
    );
    const discountAmount = couponApplication?.discountAmount ?? new Prisma.Decimal(0);
    const total = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      subtotal.minus(discountAmount).plus(shippingCost)
    );

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.findOrCreateCustomer(
        tx,
        payload.customerEmail,
        payload.customerName
      );

      const order = await tx.order.create({
        data: {
          userId: customer.id,
          couponId: couponApplication?.couponId,
          couponCode: couponApplication?.couponCode,
          discountAmount,
          subtotal,
          shippingCost,
          total,
          paymentMethod: payload.paymentMethod as PaymentMethod,
          shippingMethod: payload.shippingMethod as ShippingMethod,
          shippingAddress: payload.shippingAddress.trim(),
          shippingAddress2: payload.shippingAddress2?.trim() || undefined,
          shippingCity: payload.shippingCity.trim(),
          shippingState: payload.shippingState.trim(),
          shippingPostalCode: payload.shippingPostalCode.trim(),
          notes: payload.notes?.trim() || undefined,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }))
          }
        },
        include: {
          user: true,
          items: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      });

      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        )
      );

      if (couponApplication?.couponId) {
        await this.couponsService.incrementUsage(tx, couponApplication.couponId);
      }

      return order;
    });
  }

  async updateStatus(id: string, payload: UpdateOrderStatusDto) {
    await this.ensureExists(id);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: payload.status as OrderStatus
      },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      }
    });
  }

  private normalizeItems(items: CreateOrderDto["items"]) {
    const grouped = new Map<string, number>();

    for (const item of items) {
      const productId = item.productId.trim();
      const quantity = Number(item.quantity);

      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestException("Itens do pedido sao invalidos.");
      }

      grouped.set(productId, (grouped.get(productId) ?? 0) + quantity);
    }

    return Array.from(grouped.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));
  }

  private resolveShippingQuote(
    shippingMethod: ShippingMethod,
    postalCode: string,
    subtotal: Prisma.Decimal
  ) {
    const sanitizedPostalCode = this.sanitizePostalCode(postalCode);

    if (shippingMethod === ShippingMethod.PICKUP) {
      return {
        cost: new Prisma.Decimal(0),
        estimatedDays: "Disponivel em ate 1 dia util",
        regionLabel: "Retirada local",
        freeShippingApplied: true
      };
    }

    const firstDigit = Number(sanitizedPostalCode[0] ?? "0");
    const region =
      firstDigit <= 3
        ? { label: "Sul e Sudeste", standardSurcharge: 0, expressSurcharge: 0 }
        : firstDigit <= 7
          ? {
              label: "Centro-Oeste e parte do Nordeste",
              standardSurcharge: 6.5,
              expressSurcharge: 10
            }
          : {
              label: "Norte e faixa adicional",
              standardSurcharge: 11.5,
              expressSurcharge: 18
            };

    const baseCost =
      shippingMethod === ShippingMethod.EXPRESS
        ? new Prisma.Decimal(29.9 + region.expressSurcharge)
        : new Prisma.Decimal(14.9 + region.standardSurcharge);
    const freeShippingThreshold =
      shippingMethod === ShippingMethod.STANDARD ? 249.9 : 499.9;
    const freeShippingApplied = subtotal.gte(new Prisma.Decimal(freeShippingThreshold));
    const cost = freeShippingApplied ? new Prisma.Decimal(0) : baseCost;
    const estimatedDays =
      shippingMethod === ShippingMethod.EXPRESS
        ? firstDigit <= 3
          ? "1 a 2 dias uteis"
          : firstDigit <= 7
            ? "2 a 4 dias uteis"
            : "3 a 6 dias uteis"
        : firstDigit <= 3
          ? "3 a 5 dias uteis"
          : firstDigit <= 7
            ? "5 a 8 dias uteis"
            : "7 a 12 dias uteis";

    return {
      cost,
      estimatedDays,
      regionLabel: region.label,
      freeShippingApplied
    };
  }

  private sanitizePostalCode(postalCode: string) {
    const sanitizedPostalCode = postalCode.replace(/\D/g, "");

    if (sanitizedPostalCode.length !== 8) {
      throw new BadRequestException("Informe um CEP valido com 8 digitos.");
    }

    return sanitizedPostalCode;
  }

  private async findOrCreateCustomer(
    tx: Prisma.TransactionClient,
    email: string,
    name: string
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existing = await tx.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      if (existing.role !== Role.CUSTOMER) {
        throw new BadRequestException(
          "O email informado pertence a uma conta administrativa."
        );
      }

      if (existing.name !== normalizedName) {
        return tx.user.update({
          where: { id: existing.id },
          data: { name: normalizedName }
        });
      }

      return existing;
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);

    return tx.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role: Role.CUSTOMER
      }
    });
  }

  private async ensureExists(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException("Pedido nao encontrado.");
    }
  }
}
