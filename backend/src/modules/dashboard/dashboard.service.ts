import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

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
      profitabilityItems
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
      topProductsByProfit,
      topCategoriesByProfit
    };
  }
}
