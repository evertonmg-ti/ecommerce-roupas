import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus, Role } from "@prisma/client";
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
                variantId: item.variantId?.trim() || undefined,
                variantSku: item.variantSku?.trim() || undefined,
                variantLabel: item.variantLabel?.trim() || undefined,
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
                variantId: item.variantId?.trim() || undefined,
                variantSku: item.variantSku?.trim() || undefined,
                variantLabel: item.variantLabel?.trim() || undefined,
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
          lastEmailSentAt: new Date(),
          reminderCount: {
            increment: 1
          }
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
        category: true,
        variants: true
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
        const variant = item.variantId
          ? product?.variants.find((entry) => entry.id === item.variantId)
          : undefined;

        return {
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          variantSku: item.variantSku ?? undefined,
          variantLabel: item.variantLabel ?? undefined,
          productName: item.productName,
          productSlug: item.productSlug,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          availableStock: variant?.stock ?? product?.stock ?? 0,
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
      reminderCount: cart.reminderCount,
      recoveryStage: this.resolveCartRecoveryStage(cart),
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

  async resendAbandonedCartReminder(id: string) {
    const cart = await this.prisma.abandonedCart.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!cart || cart.recoveredAt) {
      throw new NotFoundException("Carrinho abandonado nao encontrado para reenvio.");
    }

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
        lastEmailSentAt: new Date(),
        reminderCount: {
          increment: 1
        }
      }
    });

    return { success: true };
  }

  async triggerAbandonedCartCampaign(stage: "SECOND_TOUCH" | "THIRD_TOUCH") {
    const eligible = await this.prisma.abandonedCart.findMany({
      where: {
        recoveredAt: null
      },
      include: {
        items: true
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 100
    });

    const filtered = eligible.filter((cart) =>
      stage === "SECOND_TOUCH"
        ? this.isEligibleForSecondTouch(cart)
        : this.isEligibleForThirdTouch(cart)
    );

    for (const cart of filtered) {
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
          lastEmailSentAt: new Date(),
          reminderCount: {
            increment: 1
          }
        }
      });
    }

    return {
      sentCount: filtered.length
    };
  }

  async listDormantWalletCustomers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
        walletBalance: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletBalance: true,
        updatedAt: true,
        orders: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            total: true,
            status: true
          }
        },
        creditTransactions: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            description: true,
            type: true
          }
        },
        lastWalletReminderSentAt: true
      },
      orderBy: [{ walletBalance: "desc" }, { updatedAt: "asc" }]
    });

    const now = Date.now();

    return users
      .map((user) => {
        const lastOrder = user.orders[0];
        const lastCreditTransaction = user.creditTransactions[0];
        const lastInteractionAt = new Date(
          Math.max(
            lastOrder?.createdAt?.getTime() ?? 0,
            lastCreditTransaction?.createdAt?.getTime() ?? 0,
            user.updatedAt.getTime()
          )
        );
        const dormantDays = Math.floor(
          (now - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          walletBalance: Number(user.walletBalance),
          dormantDays,
          lastInteractionAt,
          lastWalletReminderSentAt: user.lastWalletReminderSentAt,
          lastOrder: lastOrder
            ? {
                id: lastOrder.id,
                createdAt: lastOrder.createdAt,
                total: Number(lastOrder.total),
                status: lastOrder.status
              }
            : null,
          lastCreditTransaction: lastCreditTransaction
            ? {
                id: lastCreditTransaction.id,
                createdAt: lastCreditTransaction.createdAt,
                description: lastCreditTransaction.description,
                type: lastCreditTransaction.type
              }
            : null
        };
      })
      .filter((user) => user.dormantDays >= 7);
  }

  async sendWalletBalanceReminder(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletBalance: true
      }
    });

    if (!user || user.role !== Role.CUSTOMER || Number(user.walletBalance) <= 0) {
      throw new NotFoundException("Cliente com saldo elegivel nao encontrado.");
    }

    await this.emailService.sendWalletBalanceReminder({
      to: user.email,
      customerName: user.name,
      walletBalance: Number(user.walletBalance)
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastWalletReminderSentAt: new Date()
      }
    });

    return { success: true };
  }

  async triggerWalletReminderCampaign(segment: "DORMANT_7_DAYS" | "DORMANT_30_DAYS") {
    const customers = await this.listDormantWalletCustomers();
    const threshold = segment === "DORMANT_30_DAYS" ? 30 : 7;
    const now = Date.now();

    const eligible = customers.filter((customer) => {
      if (customer.dormantDays < threshold) {
        return false;
      }

      if (!customer.lastWalletReminderSentAt) {
        return true;
      }

      return now - customer.lastWalletReminderSentAt.getTime() > 1000 * 60 * 60 * 24 * 7;
    });

    for (const customer of eligible) {
      await this.emailService.sendWalletBalanceReminder({
        to: customer.email,
        customerName: customer.name,
        walletBalance: customer.walletBalance
      });

      await this.prisma.user.update({
        where: { id: customer.id },
        data: {
          lastWalletReminderSentAt: new Date()
        }
      });
    }

    return {
      sentCount: eligible.length
    };
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

  private resolveCartRecoveryStage(cart: {
    reminderCount: number;
    recoveredAt: Date | null;
  }) {
    if (cart.recoveredAt) {
      return "RECOVERED";
    }

    if (cart.reminderCount >= 3) {
      return "THIRD_TOUCH";
    }

    if (cart.reminderCount >= 2) {
      return "SECOND_TOUCH";
    }

    if (cart.reminderCount >= 1) {
      return "FIRST_TOUCH";
    }

    return "NEW";
  }

  private isEligibleForSecondTouch(cart: {
    reminderCount: number;
    updatedAt: Date;
    lastEmailSentAt: Date | null;
  }) {
    if (cart.reminderCount < 1 || cart.reminderCount >= 2 || !cart.lastEmailSentAt) {
      return false;
    }

    const now = Date.now();

    return (
      now - cart.updatedAt.getTime() >= 1000 * 60 * 60 * 24 &&
      now - cart.lastEmailSentAt.getTime() >= 1000 * 60 * 60 * 18
    );
  }

  private isEligibleForThirdTouch(cart: {
    reminderCount: number;
    updatedAt: Date;
    lastEmailSentAt: Date | null;
  }) {
    if (cart.reminderCount < 2 || cart.reminderCount >= 3 || !cart.lastEmailSentAt) {
      return false;
    }

    const now = Date.now();

    return (
      now - cart.updatedAt.getTime() >= 1000 * 60 * 60 * 24 * 3 &&
      now - cart.lastEmailSentAt.getTime() >= 1000 * 60 * 60 * 24
    );
  }
}
