import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  EventLevel,
  InventoryMovementType,
  OrderStatus,
  Order,
  PaymentMethod,
  Prisma,
  ProductStatus,
  ReturnRequestType,
  ReturnFinancialStatus,
  ReturnRequestStatus,
  Role,
  ShippingMethod
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { CouponsService } from "../coupons/coupons.service";
import { EmailService } from "../email/email.service";
import { EngagementService } from "../engagement/engagement.service";
import { ObservabilityService } from "../observability/observability.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "../products/products.service";
import { CalculateShippingDto } from "./dto/calculate-shipping.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { ConfirmMockPaymentDto } from "./dto/confirm-mock-payment.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreateReturnRequestDto } from "./dto/create-return-request.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateReturnRequestStatusDto } from "./dto/update-return-request-status.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly emailService: EmailService,
    private readonly engagementService: EngagementService,
    private readonly observabilityService: ObservabilityService,
    private readonly productsService: ProductsService
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
          returnRequests: {
            orderBy: { createdAt: "desc" }
          },
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
          returnRequests: {
            orderBy: { createdAt: "desc" }
          },
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
          returnRequests: {
            orderBy: { createdAt: "desc" }
          },
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
      },
      include: {
        variants: true
      }
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException("Um ou mais produtos nao foram encontrados.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const items = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      const variant = item.variantId
        ? product?.variants.find((entry) => entry.id === item.variantId)
        : undefined;

      if (!product) {
        throw new NotFoundException("Produto nao encontrado.");
      }

      if (item.variantId && !variant) {
        throw new NotFoundException("Variacao do produto nao encontrada.");
      }

      const availableStock = variant?.stock ?? product.stock;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${product.name}.`
        );
      }

      return {
        product,
        variant,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(variant?.priceOverride ?? product.price)
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

    const order = await this.prisma.$transaction(async (tx) => {
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
              variantId: item.variant?.id,
              variantSku: item.variant?.sku,
              variantLabel: item.variant?.optionLabel,
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
          item.variant
            ? tx.productVariant.update({
                where: { id: item.variant.id },
                data: {
                  stock: {
                    decrement: item.quantity
                  }
                }
              })
            : Promise.resolve(null)
        )
      );

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

      await Promise.all(
        items.map((item) =>
          this.productsService.recordInventoryMovement(tx, {
            productId: item.product.id,
            orderId: order.id,
            type: InventoryMovementType.ORDER_RESERVATION,
            quantityDelta: -item.quantity,
            previousStock: item.product.stock,
            nextStock: item.product.stock - item.quantity,
            reason: `Reserva de estoque pelo pedido ${order.id}.`
          })
        )
      );

      if (couponApplication?.couponId) {
        await this.couponsService.incrementUsage(tx, couponApplication.couponId);
      }

      return this.attachMockPayment(order);
    });

    await this.emailService.sendOrderCreated(this.toEmailPayload(order));
    await this.engagementService.markRecoveredByEmail(order.user.email);
    await this.observabilityService.logEvent({
      type: "order.created",
      source: "orders",
      level: EventLevel.INFO,
      message: `Pedido ${order.id} criado com sucesso.`,
      metadata: {
        orderId: order.id,
        customerEmail: order.user.email,
        total: Number(order.total)
      }
    });

    return order;
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

    const result = this.attachMockPayment(paidOrder);
    await this.emailService.sendOrderStatusUpdated(this.toEmailPayload(result));
    await this.observabilityService.logEvent({
      type: "order.payment_confirmed",
      source: "orders",
      level: EventLevel.INFO,
      message: `Pagamento mock confirmado para o pedido ${result.id}.`,
      metadata: {
        orderId: result.id,
        customerEmail: result.user.email
      }
    });
    return result;
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

  async createReturnRequest(
    orderId: string,
    userId: string,
    payload: CreateReturnRequestDto
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId
      },
      include: {
        items: true,
        returnRequests: {
          where: {
            status: {
              in: [
                ReturnRequestStatus.REQUESTED,
                ReturnRequestStatus.APPROVED,
                ReturnRequestStatus.RECEIVED
              ]
            }
          }
        },
        user: true
      }
    });

    if (!order) {
      throw new NotFoundException("Pedido nao encontrado para esta conta.");
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        "Solicitacoes de devolucao ou troca ficam disponiveis apenas para pedidos entregues."
      );
    }

    if (order.returnRequests.length > 0) {
      throw new BadRequestException(
        "Ja existe uma solicitacao em andamento para este pedido."
      );
    }

    const orderItemsMap = new Map(order.items.map((item) => [item.id, item]));
    const selectedItems = payload.items.map((item) => {
      const orderItem = orderItemsMap.get(item.orderItemId);

      if (!orderItem) {
        throw new BadRequestException("Um dos itens selecionados nao pertence a este pedido.");
      }

      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          "A quantidade solicitada excede a quantidade comprada para um dos itens."
        );
      }

      return {
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        variantId: orderItem.variantId ?? undefined,
        variantLabel: orderItem.variantLabel ?? undefined,
        quantity: item.quantity
      };
    });

    const request = await this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId,
        type: payload.type,
        financialStatus:
          payload.type === "REFUND"
            ? ReturnFinancialStatus.PENDING
            : ReturnFinancialStatus.NOT_APPLICABLE,
        reason: payload.reason.trim(),
        details: payload.details?.trim() || undefined,
        selectedItems
      }
    });

    await this.observabilityService.logEvent({
      type: "order.return_request_created",
      source: "orders",
      level: EventLevel.INFO,
      message: `Solicitacao de ${payload.type} criada para o pedido ${order.id}.`,
      metadata: {
        orderId: order.id,
        userId,
        returnRequestId: request.id,
        type: payload.type
      }
    });

    return request;
  }

  async updateReturnRequestStatus(
    orderId: string,
    requestId: string,
    payload: UpdateReturnRequestStatusDto,
    actorUserId?: string
  ) {
    const request = await this.prisma.returnRequest.findFirst({
      where: {
        id: requestId,
        orderId
      },
      include: {
        order: {
          include: {
            user: true,
            items: true
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException("Solicitacao nao encontrada para este pedido.");
    }

    if (
      request.status !== payload.status &&
      !this.isValidReturnRequestTransition(request.status, payload.status)
    ) {
      throw new BadRequestException(
        "A transicao informada nao e valida para o status atual da solicitacao."
      );
    }

    const resolutionNote = payload.resolutionNote?.trim() || undefined;
    const reverseLogisticsCode = payload.reverseLogisticsCode?.trim() || undefined;
    const reverseShippingLabel = payload.reverseShippingLabel?.trim() || undefined;
    const returnDestinationAddress =
      payload.returnDestinationAddress?.trim() || undefined;
    const reverseInstructions = payload.reverseInstructions?.trim() || undefined;
    const restockNote = payload.restockNote?.trim() || undefined;
    const nextFinancialStatus =
      payload.financialStatus ?? this.resolveReturnFinancialStatus(request, payload.status);
    const refundAmount =
      payload.refundAmount === undefined
        ? request.refundAmount
        : new Prisma.Decimal(payload.refundAmount);
    const storeCreditAmount =
      payload.storeCreditAmount === undefined
        ? request.storeCreditAmount
        : new Prisma.Decimal(payload.storeCreditAmount);
    const restockItems = payload.restockItems ?? request.restockItems;

    if (payload.status === ReturnRequestStatus.REJECTED && !resolutionNote) {
      throw new BadRequestException(
        "Informe uma observacao para registrar o motivo da rejeicao."
      );
    }

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      let restockedAt = request.restockedAt;

      if (
        payload.status === ReturnRequestStatus.RECEIVED &&
        restockItems &&
        !request.restockedAt
      ) {
        await this.restockReturnRequestItems(tx, request, actorUserId, restockNote);
        restockedAt = new Date();
      }

      return tx.returnRequest.update({
        where: { id: request.id },
        data: {
          status: payload.status,
          resolutionNote,
          reverseLogisticsCode,
          reverseShippingLabel,
          returnDestinationAddress,
          reverseInstructions,
          reverseDeadlineAt: payload.reverseDeadlineAt
            ? new Date(payload.reverseDeadlineAt)
            : request.reverseDeadlineAt,
          financialStatus: nextFinancialStatus,
          refundAmount,
          storeCreditAmount,
          restockItems,
          restockNote,
          receivedAt:
            payload.status === ReturnRequestStatus.RECEIVED && !request.receivedAt
              ? new Date()
              : payload.status === ReturnRequestStatus.REQUESTED ||
                  payload.status === ReturnRequestStatus.APPROVED
                ? null
                : request.receivedAt,
          completedAt:
            payload.status === ReturnRequestStatus.COMPLETED && !request.completedAt
              ? new Date()
              : payload.status !== ReturnRequestStatus.COMPLETED
                ? null
                : request.completedAt,
          restockedAt
        }
      });
    });

    await this.observabilityService.logEvent({
      type: "order.return_request_status_updated",
      source: "orders",
      level:
        payload.status === ReturnRequestStatus.REJECTED
          ? EventLevel.WARN
          : EventLevel.INFO,
      message: `Solicitacao ${request.id} do pedido ${request.orderId} atualizada para ${payload.status}.`,
      metadata: {
        orderId: request.orderId,
        returnRequestId: request.id,
        previousStatus: request.status,
        nextStatus: payload.status,
        type: request.type,
        financialStatus: nextFinancialStatus,
        restockItems,
        refundAmount: Number(refundAmount),
        storeCreditAmount: Number(storeCreditAmount)
      }
    });

    await this.emailService.sendReturnRequestUpdated({
      to: request.order.user.email,
      customerName: request.order.user.name,
      orderId: request.orderId,
      type: request.type,
      status: payload.status,
      resolutionNote,
      reverseLogisticsCode,
      reverseShippingLabel,
      returnDestinationAddress,
      reverseInstructions,
      reverseDeadlineAt: payload.reverseDeadlineAt
        ? new Date(payload.reverseDeadlineAt)
        : request.reverseDeadlineAt ?? undefined,
      financialStatus: nextFinancialStatus,
      refundAmount: Number(refundAmount),
      storeCreditAmount: Number(storeCreditAmount)
    });

    return updatedRequest;
  }

  async listAdminReturnRequests(filters?: {
    status?: string;
    type?: string;
    financialStatus?: string;
    priority?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = this.parsePositiveInteger(filters?.page, 1);
    const pageSize = Math.min(this.parsePositiveInteger(filters?.pageSize, 12), 50);
    const normalizedStatus =
      filters?.status &&
      Object.values(ReturnRequestStatus).includes(
        filters.status as ReturnRequestStatus
      )
        ? (filters.status as ReturnRequestStatus)
        : undefined;
    const normalizedType =
      filters?.type &&
      Object.values(ReturnRequestType).includes(filters.type as ReturnRequestType)
        ? (filters.type as ReturnRequestType)
        : undefined;
    const normalizedFinancialStatus =
      filters?.financialStatus &&
      Object.values(ReturnFinancialStatus).includes(
        filters.financialStatus as ReturnFinancialStatus
      )
        ? (filters.financialStatus as ReturnFinancialStatus)
        : undefined;
    const search = filters?.search?.trim();

    const requests = await this.prisma.returnRequest.findMany({
      where: {
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
        ...(normalizedType ? { type: normalizedType } : {}),
        ...(normalizedFinancialStatus
          ? { financialStatus: normalizedFinancialStatus }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  id: {
                    contains: search,
                    mode: "insensitive"
                  }
                },
                {
                  reason: {
                    contains: search,
                    mode: "insensitive"
                  }
                },
                {
                  user: {
                    is: {
                      email: {
                        contains: search,
                        mode: "insensitive"
                      }
                    }
                  }
                },
                {
                  user: {
                    is: {
                      name: {
                        contains: search,
                        mode: "insensitive"
                      }
                    }
                  }
                },
                {
                  order: {
                    is: {
                      id: {
                        contains: search,
                        mode: "insensitive"
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        user: true,
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: { category: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const enriched = requests.map((request) => this.enrichAdminReturnRequest(request));
    const filtered =
      filters?.priority && filters.priority !== "ALL"
        ? enriched.filter((request) => request.priority === filters.priority)
        : enriched;
    const sorted = filtered.sort((left, right) => {
      const priorityScore =
        this.getReturnRequestPriorityScore(right.priority) -
        this.getReturnRequestPriorityScore(left.priority);

      if (priorityScore !== 0) {
        return priorityScore;
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
    const summary = this.buildAdminReturnRequestSummary(sorted);
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return {
      items,
      summary,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  private normalizeItems(items: CreateOrderDto["items"]) {
    const grouped = new Map<
      string,
      { productId: string; variantId?: string; quantity: number }
    >();

    for (const item of items) {
      const productId = item.productId.trim();
      const variantId = item.variantId?.trim() || undefined;
      const quantity = Number(item.quantity);

      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestException("Itens do pedido sao invalidos.");
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

    const shouldNotify =
      order.status !== nextStatus ||
      (nextStatus === OrderStatus.SHIPPED && trackingCode !== order.trackingCode);

    const result = await this.prisma.$transaction(async (tx) => {
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
            item.variantId
              ? tx.productVariant.update({
                  where: { id: item.variantId },
                  data: {
                    stock: {
                      increment: item.quantity
                    }
                  }
                })
              : Promise.resolve(null)
          )
        );

        const restockedProducts = await Promise.all(
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

        await Promise.all(
          restockedProducts.map((product, index) =>
            this.productsService.recordInventoryMovement(tx, {
              productId: product.id,
              orderId: order.id,
              type: InventoryMovementType.ORDER_CANCELLATION,
              quantityDelta: order.items[index]?.quantity ?? 0,
              previousStock: product.stock - (order.items[index]?.quantity ?? 0),
              nextStock: product.stock,
              reason: `Devolucao de estoque pelo cancelamento do pedido ${order.id}.`
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

    if (shouldNotify) {
      await this.emailService.sendOrderStatusUpdated(this.toEmailPayload(result));
    }

    if (nextStatus === OrderStatus.CANCELED) {
      await Promise.all(
        result.items.map((item) =>
          this.engagementService.notifyBackInStockIfNeeded(item.product.id)
        )
      );
    }

    await this.observabilityService.logEvent({
      type: "order.status_updated",
      source: "orders",
      level: nextStatus === OrderStatus.CANCELED ? EventLevel.WARN : EventLevel.INFO,
      message: `Pedido ${result.id} atualizado para ${nextStatus}.`,
      metadata: {
        orderId: result.id,
        previousStatus: order.status,
        nextStatus,
        trackingCode: result.trackingCode ?? undefined
      }
    });

    return result;
  }

  private toEmailPayload(
    order: Order & {
      user: { name: string; email: string };
      items: Array<{
        quantity: number;
        unitPrice: Prisma.Decimal;
        product: { name: string };
      }>;
      recipientName?: string | null;
      customerDocument?: string | null;
      customerPhone?: string | null;
      shippingNumber?: string | null;
      shippingNeighborhood?: string | null;
      trackingCode?: string | null;
      notes?: string | null;
    }
  ) {
    return {
      orderId: order.id,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      createdAt: order.createdAt,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      trackingCode: order.trackingCode ?? undefined,
      notes: order.notes ?? undefined,
      shippingAddress: order.shippingAddress,
      shippingNumber: order.shippingNumber ?? undefined,
      shippingAddress2: order.shippingAddress2 ?? undefined,
      shippingNeighborhood: order.shippingNeighborhood ?? undefined,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice)
      }))
    };
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

  private buildAdminReturnRequestSummary(
    requests: Array<{
      status: ReturnRequestStatus;
      type: ReturnRequestType;
      priority: string;
      financialStatus?: ReturnFinancialStatus;
      slaHours: number;
    }>
  ) {
    return {
      openCount: requests.filter((request) =>
        [
          ReturnRequestStatus.REQUESTED,
          ReturnRequestStatus.APPROVED,
          ReturnRequestStatus.RECEIVED
        ].includes(request.status)
      ).length,
      criticalCount: requests.filter((request) => request.priority === "CRITICAL").length,
      refundPendingCount: requests.filter(
        (request) =>
          request.type === ReturnRequestType.REFUND &&
          request.financialStatus === ReturnFinancialStatus.PENDING
      ).length,
      awaitingReceiptCount: requests.filter(
        (request) => request.status === ReturnRequestStatus.APPROVED
      ).length,
      overdueCount: requests.filter((request) => request.slaHours < 0).length
    };
  }

  private enrichAdminReturnRequest(
    request: Prisma.ReturnRequestGetPayload<{
      include: {
        user: true;
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: { category: true };
                };
              };
            };
          };
        };
      };
    }>
  ) {
    const priority = this.resolveReturnRequestPriority(request);
    const sla = this.resolveReturnRequestSla(request);

    return {
      ...request,
      priority,
      slaHours: sla.hours,
      slaLabel: sla.label,
      selectedItemsDetailed: this.parseReturnRequestSelectedItems(request.selectedItems).map(
        (selectedItem) => {
          const matchedItem = request.order.items.find(
            (item) => item.id === selectedItem.orderItemId
          );

          return {
            ...selectedItem,
            productName: matchedItem?.product.name ?? "Item",
            categoryName: matchedItem?.product.category?.name ?? "Colecao"
          };
        }
      )
    };
  }

  private async restockReturnRequestItems(
    tx: Prisma.TransactionClient,
    request: {
      id: string;
      selectedItems?: Prisma.JsonValue | null;
      order: {
        id: string;
        items: Array<{
          id: string;
          productId: string;
          variantId: string | null;
          quantity: number;
        }>;
      };
    },
    actorUserId?: string,
    restockNote?: string
  ) {
    const selectedItems = this.parseReturnRequestSelectedItems(request.selectedItems);
    const orderItemsMap = new Map(request.order.items.map((item) => [item.id, item]));

    for (const selectedItem of selectedItems) {
      const orderItem = orderItemsMap.get(selectedItem.orderItemId);

      if (!orderItem) {
        continue;
      }

      if (selectedItem.variantId) {
        await tx.productVariant.update({
          where: { id: selectedItem.variantId },
          data: {
            stock: {
              increment: selectedItem.quantity
            }
          }
        });
      }

      const updatedProduct = await tx.product.update({
        where: { id: selectedItem.productId },
        data: {
          stock: {
            increment: selectedItem.quantity
          }
        }
      });

      await this.productsService.recordInventoryMovement(tx, {
        productId: selectedItem.productId,
        orderId: request.order.id,
        actorUserId,
        type: InventoryMovementType.RETURN_RESTOCK,
        quantityDelta: selectedItem.quantity,
        previousStock: updatedProduct.stock - selectedItem.quantity,
        nextStock: updatedProduct.stock,
        reason:
          restockNote ||
          `Reentrada de estoque pela solicitacao ${request.id} do pedido ${request.order.id}.`
      });
    }
  }

  private isValidReturnRequestTransition(
    currentStatus: ReturnRequestStatus,
    nextStatus: ReturnRequestStatus
  ) {
    const transitions: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
      [ReturnRequestStatus.REQUESTED]: [
        ReturnRequestStatus.APPROVED,
        ReturnRequestStatus.REJECTED
      ],
      [ReturnRequestStatus.APPROVED]: [
        ReturnRequestStatus.RECEIVED,
        ReturnRequestStatus.REJECTED
      ],
      [ReturnRequestStatus.REJECTED]: [],
      [ReturnRequestStatus.RECEIVED]: [ReturnRequestStatus.COMPLETED],
      [ReturnRequestStatus.COMPLETED]: []
    };

    return transitions[currentStatus].includes(nextStatus);
  }

  private resolveReturnRequestPriority(request: {
    status: ReturnRequestStatus;
    reverseDeadlineAt: Date | null;
    createdAt: Date;
  }) {
    if (request.status === ReturnRequestStatus.REJECTED) {
      return "LOW";
    }

    if (request.status === ReturnRequestStatus.COMPLETED) {
      return "LOW";
    }

    const now = Date.now();

    if (request.reverseDeadlineAt) {
      const diffHours = (request.reverseDeadlineAt.getTime() - now) / 3_600_000;

      if (diffHours < 0) {
        return "CRITICAL";
      }

      if (diffHours <= 24) {
        return "HIGH";
      }
    }

    const ageHours = (now - request.createdAt.getTime()) / 3_600_000;

    if (request.status === ReturnRequestStatus.REQUESTED) {
      if (ageHours >= 72) {
        return "CRITICAL";
      }

      if (ageHours >= 24) {
        return "HIGH";
      }
    }

    if (request.status === ReturnRequestStatus.APPROVED) {
      if (ageHours >= 120) {
        return "CRITICAL";
      }

      if (ageHours >= 48) {
        return "HIGH";
      }
    }

    if (request.status === ReturnRequestStatus.RECEIVED) {
      if (ageHours >= 72) {
        return "HIGH";
      }
    }

    return "MEDIUM";
  }

  private getReturnRequestPriorityScore(priority: string) {
    switch (priority) {
      case "CRITICAL":
        return 4;
      case "HIGH":
        return 3;
      case "MEDIUM":
        return 2;
      case "LOW":
      default:
        return 1;
    }
  }

  private resolveReturnRequestSla(request: {
    status: ReturnRequestStatus;
    createdAt: Date;
    reverseDeadlineAt: Date | null;
  }) {
    const now = Date.now();

    if (request.status === ReturnRequestStatus.COMPLETED) {
      return { hours: 0, label: "Concluida" };
    }

    if (request.status === ReturnRequestStatus.REJECTED) {
      return { hours: 0, label: "Encerrada" };
    }

    if (request.reverseDeadlineAt) {
      const hours = Math.round(
        (request.reverseDeadlineAt.getTime() - now) / 3_600_000
      );

      return {
        hours,
        label:
          hours < 0
            ? `Atrasada em ${Math.abs(hours)}h`
            : `Prazo em ${hours}h`
      };
    }

    const ageHours = Math.round((now - request.createdAt.getTime()) / 3_600_000);
    return {
      hours: ageHours,
      label: `${ageHours}h em andamento`
    };
  }

  private resolveReturnFinancialStatus(
    request: {
      type: string;
      financialStatus: ReturnFinancialStatus;
    },
    nextStatus: ReturnRequestStatus
  ) {
    if (request.type === "EXCHANGE") {
      return ReturnFinancialStatus.NOT_APPLICABLE;
    }

    if (
      request.financialStatus === ReturnFinancialStatus.REFUNDED ||
      request.financialStatus === ReturnFinancialStatus.STORE_CREDIT_ISSUED
    ) {
      return request.financialStatus;
    }

    if (nextStatus === ReturnRequestStatus.REJECTED) {
      return ReturnFinancialStatus.NOT_APPLICABLE;
    }

    return ReturnFinancialStatus.PENDING;
  }

  private parseReturnRequestSelectedItems(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const entry = item as Record<string, unknown>;
        const orderItemId =
          typeof entry.orderItemId === "string" ? entry.orderItemId : undefined;
        const productId =
          typeof entry.productId === "string" ? entry.productId : undefined;
        const variantId =
          typeof entry.variantId === "string" ? entry.variantId : undefined;
        const variantLabel =
          typeof entry.variantLabel === "string" ? entry.variantLabel : undefined;
        const quantity =
          typeof entry.quantity === "number"
            ? entry.quantity
            : Number(entry.quantity ?? 0);

        if (!orderItemId || !productId || !Number.isFinite(quantity) || quantity < 1) {
          return null;
        }

        return {
          orderItemId,
          productId,
          variantId,
          variantLabel,
          quantity: Math.trunc(quantity)
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}
