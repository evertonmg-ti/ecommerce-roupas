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
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LookupOrdersDto } from "./dto/lookup-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const shippingCost = new Prisma.Decimal(
      this.resolveShippingCost(payload.shippingMethod)
    );
    const total = subtotal.plus(shippingCost);

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.findOrCreateCustomer(
        tx,
        payload.customerEmail,
        payload.customerName
      );

      const order = await tx.order.create({
        data: {
          userId: customer.id,
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

  private resolveShippingCost(shippingMethod: ShippingMethod) {
    switch (shippingMethod) {
      case ShippingMethod.EXPRESS:
        return 29.9;
      case ShippingMethod.PICKUP:
        return 0;
      case ShippingMethod.STANDARD:
      default:
        return 14.9;
    }
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
