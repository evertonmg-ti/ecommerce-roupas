import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [users, products, orders, revenueAggregate, lowStockProducts, recentOrders] =
      await Promise.all([
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
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: true
        }
      })
    ]);

    return {
      users,
      products,
      orders,
      revenue: revenueAggregate._sum.total ?? 0,
      lowStockProducts,
      recentOrders
    };
  }
}
