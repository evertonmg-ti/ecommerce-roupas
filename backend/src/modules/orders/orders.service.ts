import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  OrderStatus,
  Order,
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
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { ConfirmMockPaymentDto } from "./dto/confirm-mock-payment.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService
  ) {}

  async listAll(filters?: {
    status?: OrderStatus;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 12), 50);
    const skip = (page - 1) * pageSize;
    const where = this.buildAdminOrderWhere(filters?.status, filters?.search);
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    return {
      items: orders.map((order) => this.attachMockPayment(order)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  listByUser(userId: string) {
    return this.prisma.order
      .findMany({
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
      })
      .then((orders) => orders.map((order) => this.attachMockPayment(order)));
  }

  listByCustomerEmail(payload: LookupOrdersDto) {
    return this.prisma.order
      .findMany({
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
      })
      .then((orders) => orders.map((order) => this.attachMockPayment(order)));
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
    const customerDocument = this.sanitizeDigits(payload.customerDocument);
    const customerPhone = this.sanitizeDigits(payload.customerPhone);
    const shippingPostalCode = this.sanitizePostalCode(payload.shippingPostalCode);
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
      shippingPostalCode,
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
          recipientName: payload.recipientName.trim(),
          customerDocument,
          customerPhone,
          shippingAddress: payload.shippingAddress.trim(),
          shippingNumber: payload.shippingNumber.trim(),
          shippingAddress2: payload.shippingAddress2?.trim() || undefined,
          shippingNeighborhood: payload.shippingNeighborhood.trim(),
          shippingCity: payload.shippingCity.trim(),
          shippingState: payload.shippingState.trim(),
          shippingPostalCode,
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

      return this.attachMockPayment(order);
    });
  }

  async updateStatus(id: string, payload: UpdateOrderStatusDto) {
    return this.updateStatusWithSideEffects(id, {
      status: payload.status as OrderStatus,
      trackingCode: payload.trackingCode
    });
  }

  async confirmMockPayment(id: string, payload: ConfirmMockPaymentDto) {
    const order = await this.getOrderDetailsOrThrow(id);

    if (order.user.email !== payload.email.trim().toLowerCase()) {
      throw new BadRequestException("O email informado nao pertence a este pedido.");
    }

    if (order.status === OrderStatus.CANCELED) {
      throw new BadRequestException("Nao e possivel pagar um pedido cancelado.");
    }

    if (order.status !== OrderStatus.PENDING) {
      return this.attachMockPayment(order);
    }

    const paidOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.PAID
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

    return this.attachMockPayment(paidOrder);
  }

  async cancelByCustomer(id: string, payload: CancelOrderDto) {
    const order = await this.getOrderDetailsOrThrow(id);

    if (order.user.email !== payload.email.trim().toLowerCase()) {
      throw new BadRequestException("O email informado nao pertence a este pedido.");
    }

    return this.updateStatusWithSideEffects(id, {
      status: OrderStatus.CANCELED
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

  private sanitizeDigits(value: string) {
    return value.replace(/\D/g, "");
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

  private attachMockPayment<T extends Order & { createdAt: Date; status: OrderStatus }>(
    order: T
  ) {
    const paymentStatus = this.resolvePaymentStatus(order.status);
    const paymentData = this.buildMockPaymentData(
      order.id,
      order.paymentMethod,
      order.createdAt,
      paymentStatus
    );

    return {
      ...order,
      paymentMock: paymentData
    };
  }

  private resolvePaymentStatus(status: OrderStatus) {
    switch (status) {
      case OrderStatus.PAID:
      case OrderStatus.SHIPPED:
      case OrderStatus.DELIVERED:
        return "CONFIRMED";
      case OrderStatus.CANCELED:
        return "CANCELED";
      case OrderStatus.PENDING:
      default:
        return "PENDING";
    }
  }

  private buildMockPaymentData(
    orderId: string,
    paymentMethod: PaymentMethod,
    createdAt: Date,
    paymentStatus: "PENDING" | "CONFIRMED" | "CANCELED"
  ) {
    const normalizedId = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const shortId = normalizedId.slice(0, 12).padEnd(12, "X");

    if (paymentMethod === PaymentMethod.PIX) {
      const expiresAt = new Date(createdAt);
      expiresAt.setHours(expiresAt.getHours() + 2);

      return {
        status: paymentStatus,
        instructions:
          paymentStatus === "CONFIRMED"
            ? "Pagamento PIX confirmado com sucesso."
            : "Copie o codigo PIX ou use o QR code textual para simular o pagamento.",
        reference: `PIX-${shortId}`,
        expiresAt,
        qrCode:
          `00020126580014BR.GOV.BCB.PIX0136${shortId}` +
          `5204000053039865406100.005802BR5920MAISON AUREA MOCK6009SAO PAULO62070503***6304ABCD`,
        copyPasteCode:
          `00020126580014BR.GOV.BCB.PIX0136${shortId}` +
          `5204000053039865406100.005802BR5920MAISON AUREA MOCK6009SAO PAULO62070503***6304ABCD`
      };
    }

    if (paymentMethod === PaymentMethod.BOLETO) {
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + 3);

      return {
        status: paymentStatus,
        instructions:
          paymentStatus === "CONFIRMED"
            ? "Boleto mock marcado como pago."
            : "Use a linha digitavel abaixo para simular o pagamento do boleto.",
        reference: `BOL-${shortId}`,
        expiresAt: dueDate,
        digitableLine: `34191.79001 ${shortId.slice(0, 5)}.${shortId.slice(5, 10)} 01043.510047 ${shortId.slice(2, 7)}.${shortId.slice(7, 12)} 7 99990000010000`
      };
    }

    return {
      status: paymentStatus,
      instructions:
        paymentStatus === "CONFIRMED"
          ? "Cartao aprovado na autorizacao mock."
          : "Pagamento em cartao aguardando captura mock do pedido.",
      reference: `CC-${shortId}`,
      authorizationCode: shortId.slice(-6),
      cardBrand: "VISA",
      installments: "1x sem juros"
    };
  }

  private async getOrderDetailsOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      throw new NotFoundException("Pedido nao encontrado.");
    }

    return order;
  }

  private async updateStatusWithSideEffects(
    id: string,
    payload: { status: OrderStatus; trackingCode?: string }
  ) {
    const order = await this.getOrderDetailsOrThrow(id);
    const nextStatus = payload.status;
    const trackingCode = payload.trackingCode?.trim() || undefined;

    if (order.status === nextStatus) {
      if (trackingCode === order.trackingCode) {
        return this.attachMockPayment(order);
      }
    }

    if (order.status === OrderStatus.CANCELED && nextStatus !== OrderStatus.CANCELED) {
      throw new BadRequestException(
        "Nao e possivel reabrir um pedido cancelado automaticamente."
      );
    }

    if (
      nextStatus === OrderStatus.CANCELED &&
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException(
        "Nao e possivel cancelar um pedido que ja foi enviado ou entregue."
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          trackingCode:
            nextStatus === OrderStatus.SHIPPED || trackingCode
              ? trackingCode
              : nextStatus === OrderStatus.PENDING || nextStatus === OrderStatus.CANCELED
                ? null
                : order.trackingCode,
          paidAt:
            nextStatus === OrderStatus.PAID && !order.paidAt
              ? new Date()
              : nextStatus === OrderStatus.PENDING
                ? null
                : order.paidAt,
          shippedAt:
            nextStatus === OrderStatus.SHIPPED && !order.shippedAt
              ? new Date()
              : nextStatus === OrderStatus.PENDING || nextStatus === OrderStatus.PAID
                ? null
                : order.shippedAt,
          deliveredAt:
            nextStatus === OrderStatus.DELIVERED && !order.deliveredAt
              ? new Date()
              : nextStatus !== OrderStatus.DELIVERED
                ? null
                : order.deliveredAt,
          canceledAt:
            nextStatus === OrderStatus.CANCELED && !order.canceledAt
              ? new Date()
              : nextStatus !== OrderStatus.CANCELED
                ? null
                : order.canceledAt
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

      if (nextStatus === OrderStatus.CANCELED) {
        await Promise.all(
          order.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            })
          )
        );

        if (order.couponId) {
          await tx.coupon.updateMany({
            where: {
              id: order.couponId,
              usedCount: {
                gt: 0
              }
            },
            data: {
              usedCount: {
                decrement: 1
              }
            }
          });
        }
      }

      return this.attachMockPayment(updatedOrder);
    });
  }

  private buildAdminOrderWhere(status?: OrderStatus, rawSearch?: string) {
    const search = rawSearch?.trim();

    if (!status && !search) {
      return undefined;
    }

    const searchWhere = search
      ? {
          OR: [
            {
              id: {
                contains: search,
                mode: "insensitive" as const
              }
            },
            {
              couponCode: {
                contains: search,
                mode: "insensitive" as const
              }
            },
            {
              user: {
                name: {
                  contains: search,
                  mode: "insensitive" as const
                }
              }
            },
            {
              user: {
                email: {
                  contains: search,
                  mode: "insensitive" as const
                }
              }
            }
          ]
        }
      : undefined;

    return {
      ...(status ? { status } : {}),
      ...(searchWhere ?? {})
    } satisfies Prisma.OrderWhereInput;
  }

  private parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }
}
