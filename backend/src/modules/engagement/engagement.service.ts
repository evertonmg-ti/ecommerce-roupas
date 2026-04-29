import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBackInStockSubscriptionDto } from "./dto/create-back-in-stock-subscription.dto";
import { SaveAbandonedCartDto } from "./dto/save-abandoned-cart.dto";

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async saveAbandonedCart(payload: SaveAbandonedCartDto) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = await this.prisma.abandonedCart.findFirst({
      where: {
        email: normalizedEmail,
        recoveredAt: null
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const cart = existing
      ? await this.prisma.abandonedCart.update({
          where: { id: existing.id },
          data: {
            customerName: payload.customerName?.trim() || existing.customerName,
            items: {
              deleteMany: {},
              create: payload.items.map((item) => ({
                productId: item.productId,
                productName: item.productName.trim(),
                productSlug: item.productSlug.trim(),
                imageUrl: item.imageUrl?.trim() || undefined,
                categoryName: item.categoryName?.trim() || undefined,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice)
              }))
            }
          },
          include: {
            items: true
          }
        })
      : await this.prisma.abandonedCart.create({
          data: {
            email: normalizedEmail,
            customerName: payload.customerName?.trim() || undefined,
            token: randomUUID(),
            items: {
              create: payload.items.map((item) => ({
                productId: item.productId,
                productName: item.productName.trim(),
                productSlug: item.productSlug.trim(),
                imageUrl: item.imageUrl?.trim() || undefined,
                categoryName: item.categoryName?.trim() || undefined,
                quantity: item.quantity,
                unitPrice: new Prisma.Decimal(item.unitPrice)
              }))
            }
          },
          include: {
            items: true
          }
        });

    const shouldSendEmail =
      !cart.lastEmailSentAt ||
      Date.now() - cart.lastEmailSentAt.getTime() > 1000 * 60 * 60 * 6;

    if (shouldSendEmail) {
      await this.emailService.sendAbandonedCartReminder({
        email: cart.email,
        customerName: cart.customerName ?? "Cliente",
        token: cart.token,
        items: cart.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }))
      });

      await this.prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          lastEmailSentAt: new Date()
        }
      });
    }

    return {
      id: cart.id,
      token: cart.token
    };
  }

  async getAbandonedCartByToken(token: string) {
    const cart = await this.prisma.abandonedCart.findUnique({
      where: { token },
      include: {
        items: true
      }
    });

    if (!cart || cart.recoveredAt) {
      throw new NotFoundException("Carrinho salvo nao encontrado.");
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: cart.items.map((item) => item.productId)
        }
      },
      include: {
        category: true
      }
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    return {
      id: cart.id,
      email: cart.email,
      customerName: cart.customerName,
      token: cart.token,
      items: cart.items.map((item) => {
        const product = productMap.get(item.productId);

        return {
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          availableStock: product?.stock ?? 0,
          status: product?.status ?? "ARCHIVED"
        };
      })
    };
  }

  async markRecoveredByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    await this.prisma.abandonedCart.updateMany({
      where: {
        email: normalizedEmail,
        recoveredAt: null
      },
      data: {
        recoveredAt: new Date()
      }
    });
  }

  async subscribeBackInStock(productId: string, payload: CreateBackInStockSubscriptionDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    if (product.stock > 0) {
      throw new BadRequestException("Este produto ja esta disponivel em estoque.");
    }

    return this.prisma.backInStockSubscription.upsert({
      where: {
        email_productId: {
          email: payload.email.trim().toLowerCase(),
          productId
        }
      },
      update: {
        active: true,
        notifiedAt: null
      },
      create: {
        email: payload.email.trim().toLowerCase(),
        productId,
        active: true
      }
    });
  }

  async notifyBackInStockIfNeeded(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!product || product.stock <= 0) {
      return;
    }

    const subscriptions = await this.prisma.backInStockSubscription.findMany({
      where: {
        productId,
        active: true
      }
    });

    if (subscriptions.length === 0) {
      return;
    }

    for (const subscription of subscriptions) {
      await this.emailService.sendBackInStockEmail({
        to: subscription.email,
        productName: product.name,
        productSlug: product.slug,
        categoryName: product.category.name,
        imageUrl: product.imageUrl ?? undefined
      });
    }

    await this.prisma.backInStockSubscription.updateMany({
      where: {
        productId,
        active: true
      },
      data: {
        active: false,
        notifiedAt: new Date()
      }
    });
  }

  async listAbandonedCarts() {
    const carts = await this.prisma.abandonedCart.findMany({
      include: {
        items: true
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 50
    });

    return carts.map((cart) => ({
      id: cart.id,
      email: cart.email,
      customerName: cart.customerName,
      token: cart.token,
      itemsCount: cart.items.length,
      itemsQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      estimatedTotal: Number(
        cart.items.reduce(
          (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
          new Prisma.Decimal(0)
        )
      ),
      lastEmailSentAt: cart.lastEmailSentAt,
      recoveredAt: cart.recoveredAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice)
      }))
    }));
  }

  async listBackInStockSubscriptions() {
    const subscriptions = await this.prisma.backInStockSubscription.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: [
        {
          active: "desc"
        },
        {
          updatedAt: "desc"
        }
      ],
      take: 100
    });

    return subscriptions.map((subscription) => ({
      id: subscription.id,
      email: subscription.email,
      active: subscription.active,
      notifiedAt: subscription.notifiedAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      product: {
        id: subscription.product.id,
        name: subscription.product.name,
        slug: subscription.product.slug,
        stock: subscription.product.stock,
        status: subscription.product.status ?? ProductStatus.ARCHIVED,
        imageUrl: subscription.product.imageUrl,
        categoryName: subscription.product.category.name
      }
    }));
  }
}
