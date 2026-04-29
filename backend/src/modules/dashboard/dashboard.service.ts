import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) {}

  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);
    const settings = await this.settingsService.getSettings();

    const [
      users,
      products,
      orders,
      revenueAggregate,
      lowStockProducts,
      lowStockItems,
      recentOrders,
      recentRevenueAggregate,
      paidOrders,
      couponOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      canceledOrders,
      inventoryAggregate,
      inventoryProducts,
      recentInventoryMovements,
      profitabilityItems,
      recentRevenueOrders,
      customerOrders
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: {
          total: true
        }
      }),
      this.prisma.product.count({
        where: {
          stock: {
            lte: 5
          }
        }
      }),
      this.prisma.product.findMany({
        where: {
          stock: {
            lte: 5
          }
        },
        orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
        take: 5,
        include: {
          category: true
        }
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: true
        }
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          total: true
        }
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        }
      }),
      this.prisma.order.count({
        where: {
          couponId: {
            not: null
          }
        }
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.PENDING
        }
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.SHIPPED
        }
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED
        }
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.CANCELED
        }
      }),
      this.prisma.product.aggregate({
        _sum: {
          stock: true
        }
      }),
      this.prisma.product.findMany({
        select: {
          stock: true,
          price: true
        }
      }),
      this.prisma.inventoryMovement.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: {
              category: true
            }
          },
          actorUser: true,
          order: {
            include: {
              user: true
            }
          }
        }
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            status: {
              in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
            }
          }
        },
        include: {
          product: {
            include: {
              category: true
            }
          },
          order: true
        }
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: fourteenDaysAgo
          },
          status: {
            in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        },
        select: {
          createdAt: true,
          total: true
        },
        orderBy: { createdAt: "asc" }
      }),
      this.prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          total: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      })
    ]);

    const revenue = revenueAggregate._sum.total ?? 0;
    const recentRevenue = recentRevenueAggregate._sum.total ?? 0;
    const inventoryUnits = inventoryAggregate._sum.stock ?? 0;
    const inventoryEstimatedValue = inventoryProducts.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0
    );
    const productProfitMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        categoryId: string;
        categoryName: string;
        quantitySold: number;
        revenue: number;
        grossProfit: number;
      }
    >();
    const categoryProfitMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        quantitySold: number;
        revenue: number;
        grossProfit: number;
      }
    >();

    for (const item of profitabilityItems) {
      const quantitySold = item.quantity;
      const revenueItem = Number(item.unitPrice) * quantitySold;
      const cost = Number(item.product.costPrice) * quantitySold;
      const grossProfitItem = revenueItem - cost;
      const categoryId = item.product.category.id;
      const categoryName = item.product.category.name;
      const existingProduct = productProfitMap.get(item.productId);
      const existingCategory = categoryProfitMap.get(categoryId);

      productProfitMap.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        categoryId,
        categoryName,
        quantitySold: (existingProduct?.quantitySold ?? 0) + quantitySold,
        revenue: (existingProduct?.revenue ?? 0) + revenueItem,
        grossProfit: (existingProduct?.grossProfit ?? 0) + grossProfitItem
      });

      categoryProfitMap.set(categoryId, {
        categoryId,
        categoryName,
        quantitySold: (existingCategory?.quantitySold ?? 0) + quantitySold,
        revenue: (existingCategory?.revenue ?? 0) + revenueItem,
        grossProfit: (existingCategory?.grossProfit ?? 0) + grossProfitItem
      });
    }

    const topProductsByProfit = Array.from(productProfitMap.values())
      .map((item) => ({
        ...item,
        marginRate: item.revenue > 0 ? (item.grossProfit / item.revenue) * 100 : 0
      }))
      .sort((left, right) => right.grossProfit - left.grossProfit)
      .slice(0, 5);
    const topCategoriesByProfit = Array.from(categoryProfitMap.values())
      .map((item) => ({
        ...item,
        marginRate: item.revenue > 0 ? (item.grossProfit / item.revenue) * 100 : 0
      }))
      .sort((left, right) => right.grossProfit - left.grossProfit)
      .slice(0, 5);
    const grossProfit = Array.from(productProfitMap.values()).reduce(
      (sum, item) => sum + item.grossProfit,
      0
    );
    const paymentApprovalRate = orders > 0 ? (paidOrders / orders) * 100 : 0;
    const deliveryRate = orders > 0 ? (deliveredOrders / orders) * 100 : 0;
    const cancellationRate = orders > 0 ? (canceledOrders / orders) * 100 : 0;
    const monthlyRevenueTarget = Number(settings.monthlyRevenueTarget);
    const minimumMarginTarget = Number(settings.minimumMarginTarget ?? 25);
    const targetAchievementRate =
      monthlyRevenueTarget > 0 ? (Number(recentRevenue) / monthlyRevenueTarget) * 100 : 0;
    const revenueCurve = this.buildRevenueCurve(fourteenDaysAgo, recentRevenueOrders);
    const lowMarginProducts = Array.from(productProfitMap.values())
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        quantitySold: item.quantitySold,
        revenue: item.revenue,
        grossProfit: item.grossProfit,
        marginRate: item.revenue > 0 ? (item.grossProfit / item.revenue) * 100 : 0
      }))
      .filter((item) => item.marginRate < minimumMarginTarget)
      .sort((left, right) => left.marginRate - right.marginRate)
      .slice(0, 5);
    const executiveAlerts = [
      ...(Number(recentRevenue) < monthlyRevenueTarget && monthlyRevenueTarget > 0
        ? [
            {
              type: "REVENUE_TARGET",
              level: "WARN",
              message: "Receita recente abaixo da meta mensal configurada.",
              detail: `${Math.round(targetAchievementRate)}% da meta atingida nos ultimos 30 dias.`
            }
          ]
        : []),
      ...(Number(revenue) > 0 && grossProfit / Number(revenue) * 100 < minimumMarginTarget
        ? [
            {
              type: "MARGIN_TARGET",
              level: "WARN",
              message: "Margem consolidada abaixo do piso configurado.",
              detail: `${Math.round((grossProfit / Number(revenue)) * 100)}% de margem atual vs meta de ${Math.round(minimumMarginTarget)}%.`
            }
          ]
        : []),
      ...lowMarginProducts.slice(0, 3).map((item) => ({
        type: "LOW_MARGIN_PRODUCT",
        level: "INFO",
        message: `${item.productName} esta abaixo da margem minima.`,
        detail: `${Math.round(item.marginRate)}% de margem em ${item.categoryName}.`
      }))
    ];
    const customerMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        firstOrderAt: Date;
        lastOrderAt: Date;
        ordersCount: number;
        revenue: number;
        recentOrders30d: number;
        recentRevenue30d: number;
      }
    >();

    for (const order of customerOrders) {
      const existing = customerMap.get(order.userId);
      const orderTotal = Number(order.total);
      const isRecent = order.createdAt >= thirtyDaysAgo;

      if (!existing) {
        customerMap.set(order.userId, {
          userId: order.userId,
          name: order.user.name,
          email: order.user.email,
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
          ordersCount: 1,
          revenue: orderTotal,
          recentOrders30d: isRecent ? 1 : 0,
          recentRevenue30d: isRecent ? orderTotal : 0
        });
        continue;
      }

      existing.lastOrderAt = order.createdAt;
      existing.ordersCount += 1;
      existing.revenue += orderTotal;
      if (isRecent) {
        existing.recentOrders30d += 1;
        existing.recentRevenue30d += orderTotal;
      }
      customerMap.set(order.userId, existing);
    }

    const customers = Array.from(customerMap.values());
    const repeatCustomers = customers.filter((customer) => customer.ordersCount >= 2);
    const repeatCustomerRate =
      customers.length > 0 ? (repeatCustomers.length / customers.length) * 100 : 0;
    const averageOrdersPerCustomer =
      customers.length > 0
        ? customers.reduce((sum, customer) => sum + customer.ordersCount, 0) / customers.length
        : 0;
    const newCustomers30d = customers.filter(
      (customer) => customer.firstOrderAt >= thirtyDaysAgo
    ).length;
    const repeatCustomers30d = customers.filter(
      (customer) => customer.ordersCount >= 2 && customer.recentOrders30d > 0
    ).length;
    const recurringRevenue30d = customers
      .filter((customer) => customer.ordersCount >= 2)
      .reduce((sum, customer) => sum + customer.recentRevenue30d, 0);
    const topRecurringCustomers = [...customers]
      .sort((left, right) => {
        if (right.ordersCount !== left.ordersCount) {
          return right.ordersCount - left.ordersCount;
        }

        return right.revenue - left.revenue;
      })
      .slice(0, 5)
      .map((customer) => ({
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        ordersCount: customer.ordersCount,
        revenue: customer.revenue,
        firstOrderAt: customer.firstOrderAt,
        lastOrderAt: customer.lastOrderAt
      }));
    const cohortMonths = this.buildMonthlyCohorts(customers, now, 6);

    return {
      users,
      products,
      orders,
      revenue,
      averageTicket: orders > 0 ? Number(revenue) / orders : 0,
      recentRevenue,
      inventoryUnits,
      inventoryEstimatedValue,
      grossProfit,
      profitMargin: Number(revenue) > 0 ? (grossProfit / Number(revenue)) * 100 : 0,
      monthlyRevenueTarget,
      minimumMarginTarget,
      targetAchievementRate,
      lowStockProducts,
      paidOrders,
      couponOrders,
      ordersByStatus: {
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        canceled: canceledOrders
      },
      recentOrders,
      lowStockItems,
      recentInventoryMovements,
      funnel: {
        totalOrders: orders,
        pending: pendingOrders,
        paid: paidOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        canceled: canceledOrders,
        paymentApprovalRate,
        deliveryRate,
        cancellationRate
      },
      revenueCurve,
      executiveAlerts,
      customerInsights: {
        totalCustomers: customers.length,
        repeatCustomers: repeatCustomers.length,
        repeatCustomerRate,
        averageOrdersPerCustomer,
        newCustomers30d,
        repeatCustomers30d,
        recurringRevenue30d
      },
      customerCohorts: cohortMonths,
      topRecurringCustomers,
      topProductsByProfit,
      topCategoriesByProfit,
      lowMarginProducts
    };
  }

  private buildRevenueCurve(
    startDate: Date,
    orders: Array<{ createdAt: Date; total: { toString(): string } }>
  ) {
    const buckets = new Map<string, number>();

    for (let offset = 0; offset < 14; offset += 1) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + offset);
      buckets.set(current.toISOString().slice(0, 10), 0);
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);

      if (!buckets.has(key)) {
        continue;
      }

      buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total));
    }

    return Array.from(buckets.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }));
  }

  private buildMonthlyCohorts(
    customers: Array<{
      firstOrderAt: Date;
      ordersCount: number;
    }>,
    now: Date,
    monthsBack: number
  ) {
    return Array.from({ length: monthsBack }).map((_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - index - 1), 1);
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      const cohortCustomers = customers.filter(
        (customer) =>
          customer.firstOrderAt >= monthDate && customer.firstOrderAt < nextMonth
      );
      const repeatCustomers = cohortCustomers.filter(
        (customer) => customer.ordersCount >= 2
      );

      return {
        month: monthDate.toISOString().slice(0, 7),
        acquiredCustomers: cohortCustomers.length,
        repeatCustomers: repeatCustomers.length,
        retentionRate:
          cohortCustomers.length > 0
            ? (repeatCustomers.length / cohortCustomers.length) * 100
            : 0
      };
    });
  }
}
