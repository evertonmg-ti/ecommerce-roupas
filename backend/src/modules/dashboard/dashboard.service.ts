import { Injectable } from "@nestjs/common";
import {
  CustomerCreditTransactionType,
  OrderStatus,
  ReturnFinancialStatus,
  ReturnRequestStatus,
  ReturnRequestType,
  Role
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) {}

  async getSummary() {
    type ReplenishmentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
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
      customerOrders,
      stockForecastItems,
      returnRequestsForSummary,
      recentReturnRequestsRaw,
      customerWalletAggregate,
      creditTransactionsByType,
      recentCreditTransactionsRaw,
      pendingFinancialCasesRaw
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
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: thirtyDaysAgo
            },
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
          order: {
            select: {
              createdAt: true
            }
          }
        }
      }),
      this.prisma.returnRequest.findMany({
        select: {
          id: true,
          status: true,
          type: true,
          financialStatus: true,
          reverseDeadlineAt: true,
          createdAt: true
        }
      }),
      this.prisma.returnRequest.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      this.prisma.user.aggregate({
        where: {
          role: Role.CUSTOMER
        },
        _sum: {
          walletBalance: true
        }
      }),
      this.prisma.customerCreditTransaction.groupBy({
        by: ["type"],
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        }
      }),
      this.prisma.customerCreditTransaction.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          },
          returnRequest: {
            select: {
              id: true,
              type: true,
              status: true,
              financialStatus: true
            }
          }
        }
      }),
      this.prisma.returnRequest.findMany({
        where: {
          OR: [
            {
              status: {
                in: [
                  ReturnRequestStatus.REQUESTED,
                  ReturnRequestStatus.APPROVED,
                  ReturnRequestStatus.RECEIVED,
                  ReturnRequestStatus.COMPLETED
                ]
              },
              financialStatus: ReturnFinancialStatus.PENDING
            },
            {
              status: ReturnRequestStatus.COMPLETED,
              financialStatus: ReturnFinancialStatus.REFUNDED,
              refundAmount: {
                gt: 0
              },
              refundRecordedAt: null
            },
            {
              status: ReturnRequestStatus.COMPLETED,
              financialStatus: ReturnFinancialStatus.STORE_CREDIT_ISSUED,
              storeCreditAmount: {
                gt: 0
              },
              creditIssuedAt: null
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: [{ completedAt: "asc" }, { updatedAt: "asc" }]
      })
    ]);

    const revenue = revenueAggregate._sum.total ?? 0;
    const recentRevenue = recentRevenueAggregate._sum.total ?? 0;
    const walletBalanceTotal = Number(customerWalletAggregate._sum.walletBalance ?? 0);
    const inventoryUnits = inventoryAggregate._sum.stock ?? 0;
    const inventoryEstimatedValue = inventoryProducts.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0
    );
    const creditTotals = this.buildCreditTransactionTotals(creditTransactionsByType);
    const pendingFinancialCases = pendingFinancialCasesRaw.map((request) => {
      const priority = this.resolveReturnRequestPriority(request);
      const sla = this.resolveReturnRequestSla(request);
      const financialAmount =
        request.financialStatus === ReturnFinancialStatus.REFUNDED
          ? Number(request.refundAmount)
          : request.financialStatus === ReturnFinancialStatus.STORE_CREDIT_ISSUED
            ? Number(request.storeCreditAmount)
            : request.type === ReturnRequestType.REFUND
              ? Number(request.refundAmount)
              : Number(request.storeCreditAmount);

      return {
        id: request.id,
        orderId: request.order.id,
        orderStatus: request.order.status,
        customerName: request.user.name,
        customerEmail: request.user.email,
        type: request.type,
        status: request.status,
        financialStatus: request.financialStatus,
        reason: request.reason,
        financialAmount,
        priority,
        slaHours: sla.hours,
        slaLabel: sla.label,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        updatedAt: request.updatedAt
      };
    });
    const pendingRefundAmount = pendingFinancialCases
      .filter(
        (request) =>
          request.type === ReturnRequestType.REFUND &&
          request.financialStatus === ReturnFinancialStatus.PENDING
      )
      .reduce((sum, request) => sum + request.financialAmount, 0);
    const pendingStoreCreditAmount = pendingFinancialCases
      .filter(
        (request) =>
          request.type === ReturnRequestType.EXCHANGE &&
          request.financialStatus === ReturnFinancialStatus.PENDING
      )
      .reduce((sum, request) => sum + request.financialAmount, 0);
    const unreconciledReturnCount = pendingFinancialCases.filter((request) => {
      if (
        request.status === ReturnRequestStatus.COMPLETED &&
        request.financialStatus === ReturnFinancialStatus.PENDING
      ) {
        return true;
      }

      return (
        request.status === ReturnRequestStatus.COMPLETED &&
        request.financialAmount > 0 &&
        (request.financialStatus === ReturnFinancialStatus.REFUNDED ||
          request.financialStatus === ReturnFinancialStatus.STORE_CREDIT_ISSUED)
      );
    }).length;
    const walletReconciliationDelta = Number(
      (
        walletBalanceTotal -
        (creditTotals.totalIssued +
          creditTotals.totalManualCredits +
          creditTotals.totalCancellationReversals -
          creditTotals.totalConsumed)
      ).toFixed(2)
    );
    const financialAlerts = this.buildFinancialAlerts({
      walletBalanceTotal,
      recentRevenue: Number(recentRevenue),
      pendingRefundAmount,
      pendingStoreCreditAmount,
      unreconciledReturnCount,
      walletReconciliationDelta,
      manualAdjustmentsCount: creditTotals.manualAdjustmentsCount,
      pendingFinancialCases
    });
    const recentFinancialTransactions = recentCreditTransactionsRaw.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      balanceBefore: Number(transaction.balanceBefore),
      balanceAfter: Number(transaction.balanceAfter),
      description: transaction.description,
      createdAt: transaction.createdAt,
      user: transaction.user,
      order: transaction.order,
      returnRequest: transaction.returnRequest
    }));
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
    const recentDailyAverage =
      revenueCurve.reduce((sum, point) => sum + point.revenue, 0) / Math.max(revenueCurve.length, 1);
    const projectedRevenue30d = recentDailyAverage * 30;
    const projectedTargetAchievementRate =
      monthlyRevenueTarget > 0 ? (projectedRevenue30d / monthlyRevenueTarget) * 100 : 0;
    const projectedRevenueGap = projectedRevenue30d - monthlyRevenueTarget;
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
    const salesVelocityMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        categoryName: string;
        currentStock: number;
        quantitySold30d: number;
        revenue30d: number;
      }
    >();

    for (const item of stockForecastItems) {
      const existing = salesVelocityMap.get(item.productId);
      const revenue30d = Number(item.unitPrice) * item.quantity;

      salesVelocityMap.set(item.productId, {
        productId: item.productId,
        productName: item.product.name,
        categoryName: item.product.category.name,
        currentStock: item.product.stock,
        quantitySold30d: (existing?.quantitySold30d ?? 0) + item.quantity,
        revenue30d: (existing?.revenue30d ?? 0) + revenue30d
      });
    }

    const stockCoverage = Array.from(salesVelocityMap.values())
      .map((item) => {
        const averageDailySales = item.quantitySold30d / 30;
        const coverageDays =
          averageDailySales > 0 ? item.currentStock / averageDailySales : null;

        return {
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          currentStock: item.currentStock,
          quantitySold30d: item.quantitySold30d,
          averageDailySales,
          revenue30d: item.revenue30d,
          coverageDays
        };
      })
      .sort((left, right) => {
        const leftCoverage = left.coverageDays ?? Number.POSITIVE_INFINITY;
        const rightCoverage = right.coverageDays ?? Number.POSITIVE_INFINITY;

        return leftCoverage - rightCoverage;
      });
    const purchaseSuggestions = stockCoverage
      .filter((item) => item.averageDailySales > 0)
      .map((item) => {
        const targetCoverageDays = item.averageDailySales >= 1 ? 30 : 21;
        const suggestedQuantity = Math.max(
          0,
          Math.ceil(item.averageDailySales * targetCoverageDays - item.currentStock)
        );
        const productCostPrice =
          stockForecastItems.find((stockItem) => stockItem.productId === item.productId)?.product
            .costPrice ?? 0;
        const projectedCoverageDays =
          item.averageDailySales > 0
            ? (item.currentStock + suggestedQuantity) / item.averageDailySales
            : null;
        const addedCoverageDays =
          item.coverageDays !== null && projectedCoverageDays !== null
            ? projectedCoverageDays - item.coverageDays
            : null;

        return {
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          currentStock: item.currentStock,
          quantitySold30d: item.quantitySold30d,
          averageDailySales: item.averageDailySales,
          coverageDays: item.coverageDays,
          targetCoverageDays,
          suggestedQuantity,
          estimatedPurchaseCost: Number(productCostPrice) * suggestedQuantity,
          projectedCoverageDays,
          addedCoverageDays,
          priority: (
            item.coverageDays !== null && item.coverageDays <= 7
              ? "CRITICAL"
              : item.coverageDays !== null && item.coverageDays <= 14
                ? "HIGH"
                : item.coverageDays !== null && item.coverageDays <= 30
                  ? "MEDIUM"
                  : "LOW"
          ) as ReplenishmentPriority
        };
      })
      .filter((item) => item.suggestedQuantity > 0)
      .sort((left, right) => {
        const leftCoverage = left.coverageDays ?? Number.POSITIVE_INFINITY;
        const rightCoverage = right.coverageDays ?? Number.POSITIVE_INFINITY;

        if (leftCoverage !== rightCoverage) {
          return leftCoverage - rightCoverage;
        }

        return right.suggestedQuantity - left.suggestedQuantity;
      });
    const replenishmentCategoryMap = new Map<
      string,
      {
        categoryName: string;
        productsAtRisk: number;
        totalSuggestedUnits: number;
        totalCurrentStock: number;
        totalCoverageDays: number;
        coveredProducts: number;
        estimatedPurchaseCost: number;
        projectedCoverageDaysTotal: number;
        projectedCoverageProducts: number;
        highestPriority: ReplenishmentPriority;
      }
    >();

    for (const item of purchaseSuggestions) {
      const existing = replenishmentCategoryMap.get(item.categoryName);

      replenishmentCategoryMap.set(item.categoryName, {
        categoryName: item.categoryName,
        productsAtRisk: (existing?.productsAtRisk ?? 0) + 1,
        totalSuggestedUnits: (existing?.totalSuggestedUnits ?? 0) + item.suggestedQuantity,
        totalCurrentStock: (existing?.totalCurrentStock ?? 0) + item.currentStock,
        totalCoverageDays: (existing?.totalCoverageDays ?? 0) + (item.coverageDays ?? 0),
        coveredProducts: (existing?.coveredProducts ?? 0) + (item.coverageDays !== null ? 1 : 0),
        estimatedPurchaseCost:
          (existing?.estimatedPurchaseCost ?? 0) + item.estimatedPurchaseCost,
        projectedCoverageDaysTotal:
          (existing?.projectedCoverageDaysTotal ?? 0) + (item.projectedCoverageDays ?? 0),
        projectedCoverageProducts:
          (existing?.projectedCoverageProducts ?? 0) +
          (item.projectedCoverageDays !== null ? 1 : 0),
        highestPriority: this.maxPriority(existing?.highestPriority, item.priority)
      });
    }

    const replenishmentByCategory = Array.from(replenishmentCategoryMap.values())
      .map((item) => ({
        categoryName: item.categoryName,
        productsAtRisk: item.productsAtRisk,
        totalSuggestedUnits: item.totalSuggestedUnits,
        totalCurrentStock: item.totalCurrentStock,
        estimatedPurchaseCost: item.estimatedPurchaseCost,
        averageCoverageDays:
          item.coveredProducts > 0 ? item.totalCoverageDays / item.coveredProducts : null,
        projectedCoverageDays:
          item.projectedCoverageProducts > 0
            ? item.projectedCoverageDaysTotal / item.projectedCoverageProducts
            : null,
        priority: item.highestPriority
      }))
      .sort((left, right) => {
        const priorityDelta =
          this.priorityWeight(right.priority) - this.priorityWeight(left.priority);

        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return right.totalSuggestedUnits - left.totalSuggestedUnits;
      });
    const totalSuggestedPurchaseCost = purchaseSuggestions.reduce(
      (sum, item) => sum + item.estimatedPurchaseCost,
      0
    );
    const totalSuggestedUnits = purchaseSuggestions.reduce(
      (sum, item) => sum + item.suggestedQuantity,
      0
    );
    const monthlyPurchasePlan = replenishmentByCategory.map((item) => ({
      categoryName: item.categoryName,
      priority: item.priority,
      productsAtRisk: item.productsAtRisk,
      totalSuggestedUnits: item.totalSuggestedUnits,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      averageCoverageDays: item.averageCoverageDays,
      projectedCoverageDays: item.projectedCoverageDays,
      budgetShare:
        totalSuggestedPurchaseCost > 0
          ? (item.estimatedPurchaseCost / totalSuggestedPurchaseCost) * 100
          : 0
    }));
    const priorityOrder: ReplenishmentPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const buildBudgetScenario = (
      name: string,
      description: string,
      allowedPriorities: ReplenishmentPriority[]
    ) => {
      const coveredItems = purchaseSuggestions.filter((item) =>
        allowedPriorities.includes(item.priority)
      );
      const investment = coveredItems.reduce(
        (sum, item) => sum + item.estimatedPurchaseCost,
        0
      );
      const suggestedUnits = coveredItems.reduce(
        (sum, item) => sum + item.suggestedQuantity,
        0
      );
      const averageCoverageGain =
        coveredItems.length > 0
          ? coveredItems.reduce((sum, item) => sum + (item.addedCoverageDays ?? 0), 0) /
            coveredItems.length
          : 0;

      return {
        name,
        description,
        investment,
        suggestedUnits,
        coveredItems: coveredItems.length,
        totalItems: purchaseSuggestions.length,
        averageCoverageGain,
        coverageShare:
          purchaseSuggestions.length > 0
            ? (coveredItems.length / purchaseSuggestions.length) * 100
            : 0,
        prioritiesCovered: allowedPriorities
      };
    };
    const budgetScenarios = [
      buildBudgetScenario(
        "Essencial",
        "Foca apenas nos itens com maior risco de ruptura imediata.",
        priorityOrder.filter((priority) => priority === "CRITICAL" || priority === "HIGH")
      ),
      buildBudgetScenario(
        "Balanceado",
        "Cobre ruptura e tambem a reposicao de giro intermediario.",
        priorityOrder.filter((priority) => priority !== "LOW")
      ),
      buildBudgetScenario(
        "Completo",
        "Executa o plano inteiro sugerido para recompor cobertura.",
        priorityOrder
      )
    ];
    const replenishmentSchedule = purchaseSuggestions.map((item) => {
      const daysUntilAction =
        item.priority === "CRITICAL"
          ? 0
          : item.priority === "HIGH"
            ? 2
            : item.priority === "MEDIUM"
              ? 7
              : 14;
      const actionDate = new Date(now);
      actionDate.setDate(now.getDate() + daysUntilAction);

      return {
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        priority: item.priority,
        suggestedQuantity: item.suggestedQuantity,
        estimatedPurchaseCost: item.estimatedPurchaseCost,
        coverageDays: item.coverageDays,
        projectedCoverageDays: item.projectedCoverageDays,
        actionDate,
        actionWindowLabel:
          daysUntilAction === 0
            ? "Hoje"
            : daysUntilAction <= 2
              ? "Proximas 48h"
              : daysUntilAction <= 7
                ? "Esta semana"
                : "Proxima semana"
      };
    });
    const operationalAgenda = priorityOrder
      .map((priority) => {
        const items = replenishmentSchedule.filter((item) => item.priority === priority);

        return {
          priority,
          label:
            priority === "CRITICAL"
              ? "Acao imediata"
              : priority === "HIGH"
                ? "Curto prazo"
                : priority === "MEDIUM"
                  ? "Planejar esta semana"
                  : "Monitorar proximo ciclo",
          itemsCount: items.length,
          estimatedPurchaseCost: items.reduce(
            (sum, item) => sum + item.estimatedPurchaseCost,
            0
          ),
          suggestedUnits: items.reduce((sum, item) => sum + item.suggestedQuantity, 0),
          nextActionDate: items[0]?.actionDate ?? null
        };
      })
      .filter((item) => item.itemsCount > 0);
    const stockoutRiskItems = stockCoverage.filter(
      (item) => item.coverageDays !== null && item.coverageDays <= 14
    );
    const slowMovingStockItems = stockCoverage.filter(
      (item) => item.quantitySold30d === 0 && item.currentStock >= 10
    );
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
    const predictiveAlerts = [
      ...(monthlyRevenueTarget > 0 && projectedRevenue30d < monthlyRevenueTarget
        ? [
            {
              type: "REVENUE_FORECAST_RISK",
              level: "WARN",
              message: "A projeção de receita mensal indica risco de fechar abaixo da meta.",
              detail: `Ritmo projetado de ${this.formatCurrency(projectedRevenue30d)} contra meta de ${this.formatCurrency(monthlyRevenueTarget)}.`
            }
          ]
        : []),
      ...stockoutRiskItems.slice(0, 3).map((item) => ({
        type: "STOCKOUT_RISK",
        level: item.coverageDays !== null && item.coverageDays <= 7 ? "WARN" : "INFO",
        message: `${item.productName} pode romper em breve.`,
        detail: `Cobertura estimada de ${Math.max(0, Math.round(item.coverageDays ?? 0))} dias com ${item.currentStock} unidades restantes.`
      })),
      ...slowMovingStockItems.slice(0, 2).map((item) => ({
        type: "SLOW_MOVING_STOCK",
        level: "INFO",
        message: `${item.productName} tem estoque parado.`,
        detail: `${item.currentStock} unidades sem giro relevante nos ultimos 30 dias.`
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
    const returnRequestsSummaryEnriched = returnRequestsForSummary.map((request) => ({
      ...request,
      priority: this.resolveReturnRequestPriority(request),
      slaHours: this.resolveReturnRequestSla(request).hours
    }));
    const recentReturnRequests = recentReturnRequestsRaw
      .map((request) => {
        const priority = this.resolveReturnRequestPriority(request);
        const sla = this.resolveReturnRequestSla(request);

        return {
          id: request.id,
          status: request.status,
          type: request.type,
          financialStatus: request.financialStatus,
          reason: request.reason,
          createdAt: request.createdAt,
          priority,
          slaHours: sla.hours,
          slaLabel: sla.label,
          user: request.user,
          order: request.order
        };
      })
      .sort((left, right) => {
        const priorityDelta =
          this.getReturnRequestPriorityScore(right.priority) -
          this.getReturnRequestPriorityScore(left.priority);

        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      })
      .slice(0, 5);

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
      projectedRevenue30d,
      projectedTargetAchievementRate,
      projectedRevenueGap,
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
      predictiveAlerts,
      stockCoverage: stockCoverage.slice(0, 8),
      replenishmentByCategory: replenishmentByCategory.slice(0, 6),
      purchaseSuggestions: purchaseSuggestions.slice(0, 8),
      monthlyPurchasePlan: monthlyPurchasePlan.slice(0, 6),
      purchasePlanSummary: {
        totalEstimatedInvestment: totalSuggestedPurchaseCost,
        totalSuggestedUnits,
        categoriesInPlan: monthlyPurchasePlan.length,
        itemsInPlan: purchaseSuggestions.length
      },
      budgetScenarios,
      operationalAgenda,
      replenishmentSchedule: replenishmentSchedule.slice(0, 10),
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
      returnQueueSummary: this.buildReturnQueueSummary(returnRequestsSummaryEnriched),
      recentReturnRequests,
      financialSummary: {
        walletBalanceTotal,
        totalIssuedStoreCredit: creditTotals.totalIssued,
        totalConsumedStoreCredit: creditTotals.totalConsumed,
        totalCancellationReversals: creditTotals.totalCancellationReversals,
        totalRefundsRecorded: creditTotals.totalRefunded,
        totalManualCredits: creditTotals.totalManualCredits,
        manualAdjustmentsCount: creditTotals.manualAdjustmentsCount,
        pendingRefundAmount,
        pendingStoreCreditAmount,
        unreconciledReturnCount,
        expectedWalletBalance:
          creditTotals.totalIssued +
          creditTotals.totalManualCredits +
          creditTotals.totalCancellationReversals -
          creditTotals.totalConsumed,
        walletReconciliationDelta
      },
      financialAlerts,
      recentFinancialTransactions,
      pendingFinancialCases: pendingFinancialCases
        .sort((left, right) => {
          const priorityDelta =
            this.getReturnRequestPriorityScore(right.priority) -
            this.getReturnRequestPriorityScore(left.priority);

          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
        })
        .slice(0, 6),
      topProductsByProfit,
      topCategoriesByProfit,
      lowMarginProducts
    };
  }

  private buildCreditTransactionTotals(
    groups: Array<{
      type: CustomerCreditTransactionType;
      _sum: { amount: unknown };
      _count: { _all: number };
    }>
  ) {
    const totals = {
      totalIssued: 0,
      totalConsumed: 0,
      totalCancellationReversals: 0,
      totalRefunded: 0,
      totalManualCredits: 0,
      manualAdjustmentsCount: 0
    };

    for (const group of groups) {
      const amount = Number(group._sum.amount ?? 0);

      switch (group.type) {
        case CustomerCreditTransactionType.RETURN_STORE_CREDIT:
          totals.totalIssued += amount;
          break;
        case CustomerCreditTransactionType.ORDER_STORE_CREDIT_USAGE:
          totals.totalConsumed += amount;
          break;
        case CustomerCreditTransactionType.ORDER_CANCELLATION_REVERSAL:
          totals.totalCancellationReversals += amount;
          break;
        case CustomerCreditTransactionType.RETURN_REFUND_RECORDED:
          totals.totalRefunded += amount;
          break;
        case CustomerCreditTransactionType.MANUAL_CREDIT:
          totals.totalManualCredits += amount;
          totals.manualAdjustmentsCount += group._count._all;
          break;
      }
    }

    return totals;
  }

  private buildFinancialAlerts(summary: {
    walletBalanceTotal: number;
    recentRevenue: number;
    pendingRefundAmount: number;
    pendingStoreCreditAmount: number;
    unreconciledReturnCount: number;
    walletReconciliationDelta: number;
    manualAdjustmentsCount: number;
    pendingFinancialCases: Array<{
      financialStatus: ReturnFinancialStatus;
      financialAmount: number;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      status: ReturnRequestStatus;
      completedAt: Date | null;
    }>;
  }) {
    const alerts: Array<{
      type: string;
      level: string;
      message: string;
      detail: string;
    }> = [];
    const overdueCompletedCases = summary.pendingFinancialCases.filter(
      (request) =>
        request.status === ReturnRequestStatus.COMPLETED &&
        request.financialStatus === ReturnFinancialStatus.PENDING
    ).length;

    if (summary.pendingRefundAmount > 0) {
      alerts.push({
        type: "refund_backlog",
        level: summary.pendingRefundAmount >= 1000 ? "CRITICAL" : "WARN",
        message: "Ha reembolsos aguardando conciliacao",
        detail: `${this.formatCurrency(summary.pendingRefundAmount)} ainda aguardam fechamento financeiro.`
      });
    }

    if (summary.pendingStoreCreditAmount > 0) {
      alerts.push({
        type: "store_credit_backlog",
        level: summary.pendingStoreCreditAmount >= 1000 ? "CRITICAL" : "WARN",
        message: "Ha vale-troca pendente de emissao",
        detail: `${this.formatCurrency(summary.pendingStoreCreditAmount)} ainda precisam ser convertidos em credito para clientes.`
      });
    }

    if (overdueCompletedCases > 0) {
      alerts.push({
        type: "completed_returns_pending_financial",
        level: "CRITICAL",
        message: "Existem devolucoes concluidas sem baixa financeira",
        detail: `${overdueCompletedCases} casos concluidos continuam com financeiro pendente e precisam de conciliacao.`
      });
    }

    if (Math.abs(summary.walletReconciliationDelta) >= 0.01) {
      alerts.push({
        type: "wallet_reconciliation_delta",
        level: "ERROR",
        message: "Saldo da carteira diverge do razao financeiro",
        detail: `A diferenca atual e de ${this.formatCurrency(Math.abs(summary.walletReconciliationDelta))} entre saldo em carteira e movimentacoes registradas.`
      });
    }

    if (
      summary.walletBalanceTotal > 0 &&
      summary.recentRevenue > 0 &&
      summary.walletBalanceTotal / summary.recentRevenue >= 0.25
    ) {
      alerts.push({
        type: "wallet_liability_high",
        level: "WARN",
        message: "Passivo em carteira esta relevante frente a receita recente",
        detail: `${this.formatCurrency(summary.walletBalanceTotal)} em credito representa ${Math.round((summary.walletBalanceTotal / summary.recentRevenue) * 100)}% da receita dos ultimos 30 dias.`
      });
    }

    if (summary.manualAdjustmentsCount >= 5) {
      alerts.push({
        type: "manual_adjustments_volume",
        level: "WARN",
        message: "Volume alto de ajustes manuais na carteira",
        detail: `${summary.manualAdjustmentsCount} ajustes manuais ja foram registrados na carteira. Vale revisar se isso esta acima do normal da operacao.`
      });
    }

    return alerts;
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  private priorityWeight(priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
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

  private maxPriority(
    current: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined,
    next: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  ) {
    if (!current) {
      return next;
    }

    return this.priorityWeight(next) > this.priorityWeight(current) ? next : current;
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

  private buildReturnQueueSummary(
    requests: Array<{
      status: ReturnRequestStatus;
      type: ReturnRequestType;
      financialStatus: ReturnFinancialStatus;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      slaHours: number;
    }>
  ) {
    return {
      openCount: requests.filter(
        (request) =>
          request.status === ReturnRequestStatus.REQUESTED ||
          request.status === ReturnRequestStatus.APPROVED ||
          request.status === ReturnRequestStatus.RECEIVED
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

  private resolveReturnRequestPriority(request: {
    status: ReturnRequestStatus;
    reverseDeadlineAt: Date | null;
    createdAt: Date;
  }): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (
      request.status === ReturnRequestStatus.REJECTED ||
      request.status === ReturnRequestStatus.COMPLETED
    ) {
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

    if (request.status === ReturnRequestStatus.RECEIVED && ageHours >= 72) {
      return "HIGH";
    }

    return "MEDIUM";
  }

  private getReturnRequestPriorityScore(priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
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
      const hours = Math.round((request.reverseDeadlineAt.getTime() - now) / 3_600_000);

      return {
        hours,
        label: hours < 0 ? `Atrasada em ${Math.abs(hours)}h` : `Prazo em ${hours}h`
      };
    }

    const ageHours = Math.round((now - request.createdAt.getTime()) / 3_600_000);

    return {
      hours: ageHours,
      label: `${ageHours}h em andamento`
    };
  }
}
