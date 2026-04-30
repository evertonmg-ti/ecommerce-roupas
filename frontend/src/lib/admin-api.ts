import "server-only";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class AdminAuthError extends Error {
  constructor() {
    super("Sessao administrativa invalida.");
    this.name = "AdminAuthError";
  }
}

export class AdminRequestError extends Error {
  constructor(
    message = "Falha na operacao administrativa.",
    public readonly code = "generic_error"
  ) {
    super(message);
    this.name = "AdminRequestError";
  }
}

type DashboardResponse = {
  users: number;
  products: number;
  orders: number;
  revenue: number | string | null;
  averageTicket: number | string | null;
  recentRevenue: number | string | null;
  inventoryUnits: number;
  inventoryEstimatedValue: number | string | null;
  grossProfit: number | string | null;
  profitMargin: number;
  monthlyRevenueTarget: number | string | null;
  minimumMarginTarget: number;
  targetAchievementRate: number;
  projectedRevenue30d: number | string | null;
  projectedTargetAchievementRate: number;
  projectedRevenueGap: number | string | null;
  lowStockProducts: number;
  paidOrders: number;
  couponOrders: number;
  ordersByStatus: {
    pending: number;
    shipped: number;
    delivered: number;
    canceled: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    stock: number;
    category?: {
      name: string;
    } | null;
  }>;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number | string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  recentInventoryMovements: Array<{
    id: string;
    type: string;
    quantityDelta: number;
    previousStock: number;
    nextStock: number;
    reason?: string | null;
    createdAt: string;
    product: {
      id: string;
      name: string;
      category?: {
        name: string;
      } | null;
    };
    actorUser?: {
      id: string;
      name: string;
      email: string;
    } | null;
    order?: {
      id: string;
      user?: {
        name: string;
        email: string;
      } | null;
    } | null;
  }>;
  funnel: {
    totalOrders: number;
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
    canceled: number;
    paymentApprovalRate: number;
    deliveryRate: number;
    cancellationRate: number;
  };
  revenueCurve: Array<{
    date: string;
    revenue: number;
  }>;
  executiveAlerts: Array<{
    type: string;
    level: string;
    message: string;
    detail: string;
  }>;
  predictiveAlerts: Array<{
    type: string;
    level: string;
    message: string;
    detail: string;
  }>;
  stockCoverage: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    currentStock: number;
    quantitySold30d: number;
    averageDailySales: number;
    revenue30d: number;
    coverageDays: number | null;
  }>;
  replenishmentByCategory: Array<{
    categoryName: string;
    productsAtRisk: number;
    totalSuggestedUnits: number;
    totalCurrentStock: number;
    estimatedPurchaseCost: number;
    averageCoverageDays: number | null;
    projectedCoverageDays: number | null;
    priority: string;
  }>;
  purchaseSuggestions: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    currentStock: number;
    quantitySold30d: number;
    averageDailySales: number;
    coverageDays: number | null;
    targetCoverageDays: number;
    suggestedQuantity: number;
    estimatedPurchaseCost: number;
    projectedCoverageDays: number | null;
    addedCoverageDays: number | null;
    priority: string;
  }>;
  monthlyPurchasePlan: Array<{
    categoryName: string;
    priority: string;
    productsAtRisk: number;
    totalSuggestedUnits: number;
    estimatedPurchaseCost: number;
    averageCoverageDays: number | null;
    projectedCoverageDays: number | null;
    budgetShare: number;
  }>;
  purchasePlanSummary: {
    totalEstimatedInvestment: number;
    totalSuggestedUnits: number;
    categoriesInPlan: number;
    itemsInPlan: number;
  };
  budgetScenarios: Array<{
    name: string;
    description: string;
    investment: number;
    suggestedUnits: number;
    coveredItems: number;
    totalItems: number;
    averageCoverageGain: number;
    coverageShare: number;
    prioritiesCovered: string[];
  }>;
  operationalAgenda: Array<{
    priority: string;
    label: string;
    itemsCount: number;
    estimatedPurchaseCost: number;
    suggestedUnits: number;
    nextActionDate: string | null;
  }>;
  replenishmentSchedule: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    priority: string;
    suggestedQuantity: number;
    estimatedPurchaseCost: number;
    coverageDays: number | null;
    projectedCoverageDays: number | null;
    actionDate: string;
    actionWindowLabel: string;
  }>;
  customerInsights: {
    totalCustomers: number;
    repeatCustomers: number;
    repeatCustomerRate: number;
    averageOrdersPerCustomer: number;
    newCustomers30d: number;
    repeatCustomers30d: number;
    recurringRevenue30d: number;
  };
  customerCohorts: Array<{
    month: string;
    acquiredCustomers: number;
    repeatCustomers: number;
    retentionRate: number;
  }>;
  returnQueueSummary: {
    openCount: number;
    criticalCount: number;
    refundPendingCount: number;
    awaitingReceiptCount: number;
    overdueCount: number;
  };
  recentReturnRequests: Array<{
    id: string;
    status: string;
    type: string;
    financialStatus: string;
    reason: string;
    createdAt: string;
    priority: string;
    slaHours: number;
    slaLabel: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    order: {
      id: string;
      status: string;
      createdAt: string;
    };
  }>;
  topRecurringCustomers: Array<{
    userId: string;
    name: string;
    email: string;
    ordersCount: number;
    revenue: number;
    firstOrderAt: string;
    lastOrderAt: string;
  }>;
  topProductsByProfit: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
  topCategoriesByProfit: Array<{
    categoryId: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
  lowMarginProducts: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
};

type ProductResponse = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  costPrice: number | string;
  compareAt?: number | string | null;
  stock: number;
  status: string;
  imageUrl?: string | null;
  categoryId: string;
  category?: {
    name: string;
  } | null;
  variants?: Array<{
    id: string;
    sku: string;
    color?: string | null;
    size?: string | null;
    optionLabel: string;
    priceOverride?: number | string | null;
    compareAtOverride?: number | string | null;
    stock: number;
    imageUrl?: string | null;
    isDefault: boolean;
  }>;
};

type PaginatedProductsResponse = {
  items: ProductResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type InventoryMovementResponse = {
  id: string;
  type: string;
  quantityDelta: number;
  previousStock: number;
  nextStock: number;
  reason?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    category?: {
      name: string;
    } | null;
  };
  actorUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  order?: {
    id: string;
    user?: {
      name: string;
      email: string;
    } | null;
  } | null;
};

type PaginatedInventoryMovementsResponse = {
  items: InventoryMovementResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type CouponResponse = {
  id: string;
  code: string;
  description?: string | null;
  type: string;
  value: number | string;
  active: boolean;
  minSubtotal: number | string;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type SettingsResponse = {
  id: number;
  storeName: string;
  storeUrl: string;
  supportEmail?: string | null;
  monthlyRevenueTarget: number | string;
  minimumMarginTarget: number;
  emailEnabled: boolean;
  emailFrom: string;
  emailReplyTo?: string | null;
  emailOrdersTo?: string | null;
  smtpHost?: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string | null;
  smtpPass?: string | null;
};

type ObservabilityEventResponse = {
  id: string;
  type: string;
  level: string;
  source: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
};

type AdminAuditLogResponse = {
  id: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  method: string;
  path: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  payload?: unknown;
  createdAt: string;
};

type AbandonedCartResponse = {
  id: string;
  email: string;
  customerName?: string | null;
  token: string;
  itemsCount: number;
  itemsQuantity: number;
  estimatedTotal: number | string;
  lastEmailSentAt?: string | null;
  recoveredAt?: string | null;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    imageUrl?: string | null;
    categoryName?: string | null;
    quantity: number;
    unitPrice: number | string;
  }>;
};

type BackInStockSubscriptionResponse = {
  id: string;
  email: string;
  active: boolean;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    status: string;
    imageUrl?: string | null;
    categoryName: string;
  };
};

type PaginatedEventsResponse = {
  items: ObservabilityEventResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type PaginatedAuditResponse = {
  items: AdminAuditLogResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type OrderResponse = {
  id: string;
  couponCode?: string | null;
  discountAmount: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  total: number | string;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  recipientName?: string | null;
  customerDocument?: string | null;
  customerPhone?: string | null;
  shippingAddress: string;
  shippingNumber?: string | null;
  shippingAddress2?: string | null;
  shippingNeighborhood?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  trackingCode?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  canceledAt?: string | null;
  notes?: string | null;
  paymentMock?: {
    status: string;
    instructions: string;
    reference: string;
    expiresAt?: string | null;
    qrCode?: string | null;
    copyPasteCode?: string | null;
    digitableLine?: string | null;
    authorizationCode?: string | null;
    cardBrand?: string | null;
    installments?: string | null;
  } | null;
  createdAt: string;
  returnRequests?: Array<{
    id: string;
    type: string;
    status: string;
    financialStatus?: string;
    reason: string;
    details?: string | null;
    resolutionNote?: string | null;
    reverseLogisticsCode?: string | null;
    reverseShippingLabel?: string | null;
    returnDestinationAddress?: string | null;
    reverseInstructions?: string | null;
    reverseDeadlineAt?: string | null;
    refundAmount?: number | string;
    storeCreditAmount?: number | string;
    restockItems?: boolean;
    restockNote?: string | null;
    receivedAt?: string | null;
    completedAt?: string | null;
    restockedAt?: string | null;
    selectedItems?: Array<{
      orderItemId: string;
      productId: string;
      variantId?: string | null;
      variantLabel?: string | null;
      quantity: number;
    }> | null;
    createdAt: string;
    updatedAt: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    variantId?: string | null;
    variantSku?: string | null;
    variantLabel?: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      imageUrl?: string | null;
      category?: {
        name: string;
      } | null;
    };
  }>;
};

type PaginatedOrdersResponse = {
  items: OrderResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type PaginatedReturnRequestsResponse = {
  items: Array<{
    id: string;
    orderId: string;
    userId: string;
    type: string;
    status: string;
    financialStatus?: string | null;
    reason: string;
    details?: string | null;
    resolutionNote?: string | null;
    reverseLogisticsCode?: string | null;
    reverseShippingLabel?: string | null;
    returnDestinationAddress?: string | null;
    reverseInstructions?: string | null;
    reverseDeadlineAt?: string | null;
    refundAmount: number | string;
    storeCreditAmount: number | string;
    restockItems: boolean;
    restockNote?: string | null;
    receivedAt?: string | null;
    completedAt?: string | null;
    restockedAt?: string | null;
    priority: string;
    slaHours: number;
    slaLabel: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    order: {
      id: string;
      status: string;
      createdAt: string;
    };
    selectedItemsDetailed: Array<{
      orderItemId: string;
      productId: string;
      variantId?: string | null;
      variantLabel?: string | null;
      quantity: number;
      productName: string;
      categoryName: string;
    }>;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    openCount: number;
    criticalCount: number;
    refundPendingCount: number;
    awaitingReceiptCount: number;
    overdueCount: number;
  };
};

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminRecentOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  createdAt: string;
};

export type AdminDashboardData = {
  metrics: AdminMetric[];
  recentOrders: AdminRecentOrder[];
  commerceHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  funnelHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  targetHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  forecastHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  postSaleHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  revenueCurve: Array<{
    date: string;
    label: string;
    revenue: number;
  }>;
  executiveAlerts: Array<{
    type: string;
    level: string;
    message: string;
    detail: string;
  }>;
  predictiveAlerts: Array<{
    type: string;
    level: string;
    message: string;
    detail: string;
  }>;
  stockCoverage: Array<{
    id: string;
    name: string;
    category: string;
    currentStock: number;
    quantitySold30d: number;
    averageDailySales: number;
    revenue30d: number;
    coverageDays?: number;
  }>;
  replenishmentByCategory: Array<{
    category: string;
    productsAtRisk: number;
    totalSuggestedUnits: number;
    totalCurrentStock: number;
    estimatedPurchaseCost: number;
    averageCoverageDays?: number;
    projectedCoverageDays?: number;
    priority: string;
  }>;
  purchaseSuggestions: Array<{
    id: string;
    name: string;
    category: string;
    currentStock: number;
    quantitySold30d: number;
    averageDailySales: number;
    coverageDays?: number;
    targetCoverageDays: number;
    suggestedQuantity: number;
    estimatedPurchaseCost: number;
    projectedCoverageDays?: number;
    addedCoverageDays?: number;
    priority: string;
  }>;
  monthlyPurchasePlan: Array<{
    category: string;
    priority: string;
    productsAtRisk: number;
    totalSuggestedUnits: number;
    estimatedPurchaseCost: number;
    averageCoverageDays?: number;
    projectedCoverageDays?: number;
    budgetShare: number;
  }>;
  purchasePlanSummary: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  budgetScenarios: Array<{
    name: string;
    description: string;
    investment: number;
    suggestedUnits: number;
    coveredItems: number;
    totalItems: number;
    averageCoverageGain: number;
    coverageShare: number;
    prioritiesCovered: string[];
  }>;
  operationalAgenda: Array<{
    priority: string;
    label: string;
    itemsCount: number;
    estimatedPurchaseCost: number;
    suggestedUnits: number;
    nextActionDate?: string;
  }>;
  replenishmentSchedule: Array<{
    id: string;
    name: string;
    category: string;
    priority: string;
    suggestedQuantity: number;
    estimatedPurchaseCost: number;
    coverageDays?: number;
    projectedCoverageDays?: number;
    actionDate: string;
    actionWindowLabel: string;
  }>;
  customerHighlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  customerCohorts: Array<{
    month: string;
    label: string;
    acquiredCustomers: number;
    repeatCustomers: number;
    retentionRate: number;
  }>;
  recentReturnRequests: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    orderId: string;
    orderStatus: string;
    type: string;
    status: string;
    financialStatus: string;
    reason: string;
    priority: string;
    slaHours: number;
    slaLabel: string;
    createdAt: string;
  }>;
  topRecurringCustomers: Array<{
    id: string;
    name: string;
    email: string;
    ordersCount: number;
    revenue: number;
    firstOrderAt: string;
    lastOrderAt: string;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    stock: number;
    category: string;
  }>;
  inventoryHighlights: Array<{
    id: string;
    productName: string;
    category: string;
    type: string;
    quantityDelta: number;
    previousStock: number;
    nextStock: number;
    reason?: string;
    createdAt: string;
    actorName?: string;
    orderId?: string;
  }>;
  profitabilityByProduct: Array<{
    id: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
  profitabilityByCategory: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
  lowMarginProducts: Array<{
    id: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    marginRate: number;
  }>;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  compareAt?: number;
  stock: number;
  status: string;
  imageUrl?: string;
  categoryId: string;
  category: string;
  variants: Array<{
    id: string;
    sku: string;
    color?: string;
    size?: string;
    optionLabel: string;
    priceOverride?: number;
    compareAtOverride?: number;
    stock: number;
    imageUrl?: string;
    isDefault: boolean;
  }>;
};

export type AdminProductList = {
  items: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminInventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  category: string;
  type: string;
  quantityDelta: number;
  previousStock: number;
  nextStock: number;
  reason?: string;
  createdAt: string;
  actorName?: string;
  actorEmail?: string;
  orderId?: string;
  orderCustomerName?: string;
};

export type AdminInventoryMovementList = {
  items: AdminInventoryMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type AdminCoupon = {
  id: string;
  code: string;
  description?: string;
  type: string;
  value: number;
  active: boolean;
  minSubtotal: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminSettings = {
  storeName: string;
  storeUrl: string;
  supportEmail?: string;
  monthlyRevenueTarget: number;
  minimumMarginTarget: number;
  emailEnabled: boolean;
  emailFrom: string;
  emailReplyTo?: string;
  emailOrdersTo?: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

export type AdminEventLog = {
  id: string;
  type: string;
  level: string;
  source: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
};

export type AdminAuditLog = {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  method: string;
  path: string;
  action: string;
  entityType?: string;
  entityId?: string;
  statusCode?: number;
  ipAddress?: string;
  payload?: unknown;
  createdAt: string;
};

export type AdminEventLogList = {
  items: AdminEventLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminAuditLogList = {
  items: AdminAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminAbandonedCart = {
  id: string;
  email: string;
  customerName?: string;
  token: string;
  itemsCount: number;
  itemsQuantity: number;
  estimatedTotal: number;
  lastEmailSentAt?: string;
  recoveredAt?: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    imageUrl?: string;
    categoryName?: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type AdminBackInStockSubscription = {
  id: string;
  email: string;
  active: boolean;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    status: string;
    imageUrl?: string;
    categoryName: string;
  };
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  couponCode?: string;
  discountAmount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  recipientName?: string;
  customerDocument?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingNumber?: string;
  shippingAddress2?: string;
  shippingNeighborhood?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  trackingCode?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  notes?: string;
  paymentMock?: {
    status: string;
    instructions: string;
    reference: string;
    expiresAt?: string;
    qrCode?: string;
    copyPasteCode?: string;
    digitableLine?: string;
    authorizationCode?: string;
    cardBrand?: string;
    installments?: string;
  };
  createdAt: string;
  returnRequests: Array<{
    id: string;
    type: string;
    status: string;
    financialStatus?: string;
    reason: string;
    details?: string;
    resolutionNote?: string;
    reverseLogisticsCode?: string;
    reverseShippingLabel?: string;
    returnDestinationAddress?: string;
    reverseInstructions?: string;
    reverseDeadlineAt?: string;
    refundAmount: number;
    storeCreditAmount: number;
    restockItems: boolean;
    restockNote?: string;
    receivedAt?: string;
    completedAt?: string;
    restockedAt?: string;
    selectedItems: Array<{
      orderItemId: string;
      productId: string;
      variantId?: string;
      variantLabel?: string;
      quantity: number;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  items: Array<{
    id: string;
    productId: string;
    variantId?: string;
    sku?: string;
    variantLabel?: string;
    name: string;
    slug: string;
    category: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type AdminOrderList = {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminReturnRequest = {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  orderCreatedAt: string;
  type: string;
  status: string;
  financialStatus?: string;
  reason: string;
  details?: string;
  resolutionNote?: string;
  reverseLogisticsCode?: string;
  reverseShippingLabel?: string;
  returnDestinationAddress?: string;
  reverseInstructions?: string;
  reverseDeadlineAt?: string;
  refundAmount: number;
  storeCreditAmount: number;
  restockItems: boolean;
  restockNote?: string;
  receivedAt?: string;
  completedAt?: string;
  restockedAt?: string;
  priority: string;
  slaHours: number;
  slaLabel: string;
  createdAt: string;
  updatedAt: string;
  selectedItems: Array<{
    orderItemId: string;
    productId: string;
    variantId?: string;
    variantLabel?: string;
    quantity: number;
    productName: string;
    categoryName: string;
  }>;
};

export type AdminReturnRequestList = {
  items: AdminReturnRequest[];
  summary: {
    openCount: number;
    criticalCount: number;
    refundPendingCount: number;
    awaitingReceiptCount: number;
    overdueCount: number;
  };
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Falha na requisicao: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchAdmin<T>(path: string) {
  const session = await requireAdminSession();

  try {
    return await apiFetch<T>(path, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });
  } catch {
    redirect("/login");
  }
}

async function mutateAdmin<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
) {
  const session = await requireAdminSession();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AdminAuthError();
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload?.message[0]
      : payload?.message;

    throw new AdminRequestError(
      message ?? `Falha na requisicao: ${response.status}`,
      mapAdminErrorCode(message)
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function mapAdminErrorCode(message?: string) {
  if (!message) {
    return "generic_error";
  }

  if (message.includes("slug")) {
    return "slug_conflict";
  }

  if (message.includes("email")) {
    return "email_conflict";
  }

  if (message.includes("produtos vinculados")) {
    return "category_has_products";
  }

  if (message.includes("pedidos vinculados")) {
    return "user_has_orders";
  }

  if (message.includes("estoque insuficiente")) {
    return "insufficient_stock";
  }

  if (message.includes("cupom esta inativo") || message.includes("cupom expirou")) {
    return "coupon_inactive";
  }

  if (message.includes("subtotal minimo")) {
    return "coupon_min_subtotal";
  }

  if (message.includes("cancelar um pedido")) {
    return "order_cancellation_blocked";
  }

  if (message.includes("transicao informada nao e valida")) {
    return "invalid_return_request_transition";
  }

  if (message.includes("motivo da rejeicao")) {
    return "return_request_rejection_note_required";
  }

  if (message.includes("nao encontrada") || message.includes("nao encontrado")) {
    return "resource_not_found";
  }

  return "generic_error";
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTimeInput(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardData> {
  const data = await fetchAdmin<DashboardResponse>("/dashboard/summary");

  return {
    metrics: [
      {
        label: "Faturamento",
        value: formatCurrency(toNumber(data.revenue)),
        detail: "Receita consolidada dos pedidos"
      },
      {
        label: "Pedidos",
        value: String(data.orders),
        detail: "Pedidos registrados na base"
      },
      {
        label: "Produtos",
        value: String(data.products),
        detail: `${data.lowStockProducts} com estoque baixo`
      },
      {
        label: "Clientes",
        value: String(data.users),
        detail: "Usuarios criados na plataforma"
      }
    ],
    commerceHighlights: [
      {
        label: "Ticket medio",
        value: formatCurrency(toNumber(data.averageTicket)),
        detail: "Media de receita por pedido"
      },
      {
        label: "Receita 30 dias",
        value: formatCurrency(toNumber(data.recentRevenue)),
        detail: "Volume recente de pedidos"
      },
      {
        label: "Pedidos pagos",
        value: String(data.paidOrders),
        detail: `${data.ordersByStatus.pending} pendentes no momento`
      },
      {
        label: "Uso de cupons",
        value: `${data.orders > 0 ? Math.round((data.couponOrders / data.orders) * 100) : 0}%`,
        detail: `${data.couponOrders} pedidos com desconto`
      },
      {
        label: "Unidades em estoque",
        value: String(data.inventoryUnits),
        detail: "Saldo somado de todos os SKUs"
      },
      {
        label: "Estoque estimado",
        value: formatCurrency(toNumber(data.inventoryEstimatedValue)),
        detail: "Valor estimado pelo preco atual"
      },
      {
        label: "Lucro bruto",
        value: formatCurrency(toNumber(data.grossProfit)),
        detail: `${Math.round(data.profitMargin)}% de margem estimada`
      }
    ],
    funnelHighlights: [
      {
        label: "Aprovacao de pagamento",
        value: `${Math.round(data.funnel.paymentApprovalRate)}%`,
        detail: `${data.funnel.paid} pedidos aprovados`
      },
      {
        label: "Entrega concluida",
        value: `${Math.round(data.funnel.deliveryRate)}%`,
        detail: `${data.funnel.delivered} pedidos entregues`
      },
      {
        label: "Cancelamento",
        value: `${Math.round(data.funnel.cancellationRate)}%`,
        detail: `${data.funnel.canceled} pedidos cancelados`
      },
      {
        label: "Aguardando acao",
        value: String(data.funnel.pending),
        detail: "Pedidos pendentes no inicio do funil"
      }
    ],
    targetHighlights: [
      {
        label: "Meta 30 dias",
        value: formatCurrency(toNumber(data.monthlyRevenueTarget)),
        detail: "Objetivo configurado no painel"
      },
      {
        label: "Realizado",
        value: formatCurrency(toNumber(data.recentRevenue)),
        detail: `${Math.round(data.targetAchievementRate)}% da meta atingida`
      },
      {
        label: "Piso de margem",
        value: `${Math.round(data.minimumMarginTarget)}%`,
        detail: "Parametro minimo esperado para rentabilidade"
      }
    ],
    forecastHighlights: [
      {
        label: "Receita projetada",
        value: formatCurrency(toNumber(data.projectedRevenue30d)),
        detail: "Projecao simples baseada no ritmo recente"
      },
      {
        label: "Meta projetada",
        value: `${Math.round(data.projectedTargetAchievementRate)}%`,
        detail: "Percentual estimado de atingimento da meta"
      },
      {
        label: "Gap previsto",
        value: formatCurrency(Math.abs(toNumber(data.projectedRevenueGap))),
        detail:
          toNumber(data.projectedRevenueGap) >= 0
            ? "Ritmo atual acima da meta mensal"
            : "Ritmo atual abaixo da meta mensal"
      }
    ],
    postSaleHighlights: [
      {
        label: "Solicitacoes abertas",
        value: String(data.returnQueueSummary.openCount),
        detail: "Casos ativos no pos-venda"
      },
      {
        label: "Criticas",
        value: String(data.returnQueueSummary.criticalCount),
        detail: "Casos com acao imediata"
      },
      {
        label: "Reembolso pendente",
        value: String(data.returnQueueSummary.refundPendingCount),
        detail: "Solicitacoes aguardando fechamento financeiro"
      },
      {
        label: "Aguardando recebimento",
        value: String(data.returnQueueSummary.awaitingReceiptCount),
        detail: "Devolucoes aprovadas ainda nao conferidas"
      },
      {
        label: "Fora do prazo",
        value: String(data.returnQueueSummary.overdueCount),
        detail: "Solicitacoes com SLA vencido"
      }
    ],
    revenueCurve: data.revenueCurve.map((point) => ({
      date: point.date,
      label: formatDate(point.date),
      revenue: point.revenue
    })),
    executiveAlerts: data.executiveAlerts,
    predictiveAlerts: data.predictiveAlerts,
    stockCoverage: data.stockCoverage.map((item) => ({
      id: item.productId,
      name: item.productName,
      category: item.categoryName,
      currentStock: item.currentStock,
      quantitySold30d: item.quantitySold30d,
      averageDailySales: item.averageDailySales,
      revenue30d: item.revenue30d,
      coverageDays: item.coverageDays ?? undefined
    })),
    replenishmentByCategory: data.replenishmentByCategory.map((item) => ({
      category: item.categoryName,
      productsAtRisk: item.productsAtRisk,
      totalSuggestedUnits: item.totalSuggestedUnits,
      totalCurrentStock: item.totalCurrentStock,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      averageCoverageDays: item.averageCoverageDays ?? undefined,
      projectedCoverageDays: item.projectedCoverageDays ?? undefined,
      priority: item.priority
    })),
    purchaseSuggestions: data.purchaseSuggestions.map((item) => ({
      id: item.productId,
      name: item.productName,
      category: item.categoryName,
      currentStock: item.currentStock,
      quantitySold30d: item.quantitySold30d,
      averageDailySales: item.averageDailySales,
      coverageDays: item.coverageDays ?? undefined,
      targetCoverageDays: item.targetCoverageDays,
      suggestedQuantity: item.suggestedQuantity,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      projectedCoverageDays: item.projectedCoverageDays ?? undefined,
      addedCoverageDays: item.addedCoverageDays ?? undefined,
      priority: item.priority
    })),
    monthlyPurchasePlan: data.monthlyPurchasePlan.map((item) => ({
      category: item.categoryName,
      priority: item.priority,
      productsAtRisk: item.productsAtRisk,
      totalSuggestedUnits: item.totalSuggestedUnits,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      averageCoverageDays: item.averageCoverageDays ?? undefined,
      projectedCoverageDays: item.projectedCoverageDays ?? undefined,
      budgetShare: item.budgetShare
    })),
    purchasePlanSummary: [
      {
        label: "Investimento total",
        value: formatCurrency(toNumber(data.purchasePlanSummary.totalEstimatedInvestment)),
        detail: "Orcamento integral sugerido para a reposicao"
      },
      {
        label: "Unidades sugeridas",
        value: String(data.purchasePlanSummary.totalSuggestedUnits),
        detail: "Quantidade total recomendada para compra"
      },
      {
        label: "Categorias no plano",
        value: String(data.purchasePlanSummary.categoriesInPlan),
        detail: "Categorias com demanda de reposicao no ciclo"
      },
      {
        label: "SKUs no plano",
        value: String(data.purchasePlanSummary.itemsInPlan),
        detail: "Itens contemplados na sugestao de compra"
      }
    ],
    budgetScenarios: data.budgetScenarios,
    operationalAgenda: data.operationalAgenda.map((item) => ({
      priority: item.priority,
      label: item.label,
      itemsCount: item.itemsCount,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      suggestedUnits: item.suggestedUnits,
      nextActionDate: item.nextActionDate ? formatDate(item.nextActionDate) : undefined
    })),
    replenishmentSchedule: data.replenishmentSchedule.map((item) => ({
      id: item.productId,
      name: item.productName,
      category: item.categoryName,
      priority: item.priority,
      suggestedQuantity: item.suggestedQuantity,
      estimatedPurchaseCost: item.estimatedPurchaseCost,
      coverageDays: item.coverageDays ?? undefined,
      projectedCoverageDays: item.projectedCoverageDays ?? undefined,
      actionDate: formatDate(item.actionDate),
      actionWindowLabel: item.actionWindowLabel
    })),
    customerHighlights: [
      {
        label: "Clientes recorrentes",
        value: `${Math.round(data.customerInsights.repeatCustomerRate)}%`,
        detail: `${data.customerInsights.repeatCustomers} de ${data.customerInsights.totalCustomers} clientes ja recompraram`
      },
      {
        label: "Pedidos por cliente",
        value: data.customerInsights.averageOrdersPerCustomer.toFixed(1),
        detail: "Media historica de pedidos por cliente ativo"
      },
      {
        label: "Novos clientes 30d",
        value: String(data.customerInsights.newCustomers30d),
        detail: `${data.customerInsights.repeatCustomers30d} recorrentes ativos no mesmo periodo`
      },
      {
        label: "Receita recorrente 30d",
        value: formatCurrency(toNumber(data.customerInsights.recurringRevenue30d)),
        detail: "Volume vindo de clientes com 2+ pedidos"
      }
    ],
    customerCohorts: data.customerCohorts.map((item) => ({
      month: item.month,
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "2-digit"
      }).format(new Date(`${item.month}-01T00:00:00`)),
      acquiredCustomers: item.acquiredCustomers,
      repeatCustomers: item.repeatCustomers,
      retentionRate: item.retentionRate
    })),
    recentReturnRequests: data.recentReturnRequests.map((request) => ({
      id: request.id,
      customerName: request.user.name,
      customerEmail: request.user.email,
      orderId: request.order.id,
      orderStatus: request.order.status,
      type: request.type,
      status: request.status,
      financialStatus: request.financialStatus,
      reason: request.reason,
      priority: request.priority,
      slaHours: request.slaHours,
      slaLabel: request.slaLabel,
      createdAt: formatDateTime(request.createdAt)
    })),
    topRecurringCustomers: data.topRecurringCustomers.map((customer) => ({
      id: customer.userId,
      name: customer.name,
      email: customer.email,
      ordersCount: customer.ordersCount,
      revenue: customer.revenue,
      firstOrderAt: formatDate(customer.firstOrderAt),
      lastOrderAt: formatDate(customer.lastOrderAt)
    })),
    recentOrders: data.recentOrders.map((order) => ({
      id: order.id,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      total: toNumber(order.total),
      createdAt: formatDate(order.createdAt)
    })),
    lowStockItems: data.lowStockItems.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      category: product.category?.name ?? "Sem categoria"
    })),
    inventoryHighlights: data.recentInventoryMovements.map((movement) => ({
      id: movement.id,
      productName: movement.product.name,
      category: movement.product.category?.name ?? "Sem categoria",
      type: movement.type,
      quantityDelta: movement.quantityDelta,
      previousStock: movement.previousStock,
      nextStock: movement.nextStock,
      reason: movement.reason ?? undefined,
      createdAt: formatDateTime(movement.createdAt),
      actorName: movement.actorUser?.name ?? undefined,
      orderId: movement.order?.id ?? undefined
    })),
    profitabilityByProduct: data.topProductsByProfit.map((item) => ({
      id: item.productId,
      name: item.productName,
      category: item.categoryName,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
      grossProfit: item.grossProfit,
      marginRate: item.marginRate
    })),
    profitabilityByCategory: data.topCategoriesByProfit.map((item) => ({
      id: item.categoryId,
      name: item.categoryName,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
      grossProfit: item.grossProfit,
      marginRate: item.marginRate
    })),
    lowMarginProducts: data.lowMarginProducts.map((item) => ({
      id: item.productId,
      name: item.productName,
      category: item.categoryName,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
      grossProfit: item.grossProfit,
      marginRate: item.marginRate
    }))
  };
}

function normalizeAdminProduct(product: ProductResponse): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price),
    costPrice: toNumber(product.costPrice),
    compareAt:
      product.compareAt === null || product.compareAt === undefined
        ? undefined
        : toNumber(product.compareAt),
    stock: product.stock,
    status: product.status,
    imageUrl: product.imageUrl ?? undefined,
    categoryId: product.categoryId,
    category: product.category?.name ?? "Sem categoria",
    variants:
      product.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        color: variant.color ?? undefined,
        size: variant.size ?? undefined,
        optionLabel: variant.optionLabel,
        priceOverride:
          variant.priceOverride === null || variant.priceOverride === undefined
            ? undefined
            : toNumber(variant.priceOverride),
        compareAtOverride:
          variant.compareAtOverride === null ||
          variant.compareAtOverride === undefined
            ? undefined
            : toNumber(variant.compareAtOverride),
        stock: variant.stock,
        imageUrl: variant.imageUrl ?? undefined,
        isDefault: variant.isDefault
      })) ?? []
  };
}

export async function getAdminProducts(filters?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminProductList> {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedProductsResponse>(`/products/admin${suffix}`);

  return {
    items: response.items.map(normalizeAdminProduct),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export async function getAdminInventoryMovements(filters?: {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminInventoryMovementList> {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.type) {
    params.set("type", filters.type);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedInventoryMovementsResponse>(
    `/products/admin/inventory-movements${suffix}`
  );

  return {
    items: response.items.map((movement) => ({
      id: movement.id,
      productId: movement.product.id,
      productName: movement.product.name,
      productSlug: movement.product.slug,
      category: movement.product.category?.name ?? "Sem categoria",
      type: movement.type,
      quantityDelta: movement.quantityDelta,
      previousStock: movement.previousStock,
      nextStock: movement.nextStock,
      reason: movement.reason ?? undefined,
      createdAt: formatDateTime(movement.createdAt),
      actorName: movement.actorUser?.name ?? undefined,
      actorEmail: movement.actorUser?.email ?? undefined,
      orderId: movement.order?.id ?? undefined,
      orderCustomerName: movement.order?.user?.name ?? undefined
    })),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const categories = await apiFetch<CategoryResponse[]>("/categories");

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined
  }));
}

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  const coupons = await fetchAdmin<CouponResponse[]>("/coupons");

  return coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? undefined,
    type: coupon.type,
    value: toNumber(coupon.value),
    active: coupon.active,
    minSubtotal: toNumber(coupon.minSubtotal),
    usageLimit: coupon.usageLimit ?? undefined,
    usedCount: coupon.usedCount,
    startsAt: coupon.startsAt ?? undefined,
    expiresAt: coupon.expiresAt ?? undefined
  }));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const users = await fetchAdmin<UserResponse[]>("/users");

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: "Ativo",
    createdAt: formatDate(user.createdAt)
  }));
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await fetchAdmin<SettingsResponse>("/settings");

  return {
    storeName: settings.storeName,
    storeUrl: settings.storeUrl,
    supportEmail: settings.supportEmail ?? undefined,
    monthlyRevenueTarget: toNumber(settings.monthlyRevenueTarget),
    minimumMarginTarget: settings.minimumMarginTarget,
    emailEnabled: settings.emailEnabled,
    emailFrom: settings.emailFrom,
    emailReplyTo: settings.emailReplyTo ?? undefined,
    emailOrdersTo: settings.emailOrdersTo ?? undefined,
    smtpHost: settings.smtpHost ?? undefined,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure,
    smtpUser: settings.smtpUser ?? undefined,
    smtpPass: settings.smtpPass ?? undefined
  };
}

export async function getAdminEventLogs(filters?: {
  search?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminEventLogList> {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.level) {
    params.set("level", filters.level);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedEventsResponse>(
    `/observability/events${suffix}`
  );

  return {
    items: response.items.map((item) => ({
      ...item,
      createdAt: formatDateTime(item.createdAt)
    })),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export async function getAdminAuditLogs(filters?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminAuditLogList> {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedAuditResponse>(
    `/observability/audit${suffix}`
  );

  return {
    items: response.items.map((item) => ({
      ...item,
      actorUserId: item.actorUserId ?? undefined,
      actorEmail: item.actorEmail ?? undefined,
      actorName: item.actorName ?? undefined,
      actorRole: item.actorRole ?? undefined,
      entityType: item.entityType ?? undefined,
      entityId: item.entityId ?? undefined,
      statusCode: item.statusCode ?? undefined,
      ipAddress: item.ipAddress ?? undefined,
      createdAt: formatDateTime(item.createdAt)
    })),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export async function getAdminAbandonedCarts(): Promise<AdminAbandonedCart[]> {
  const carts = await fetchAdmin<AbandonedCartResponse[]>("/engagement/admin/abandoned-carts");

  return carts.map((cart) => ({
    id: cart.id,
    email: cart.email,
    customerName: cart.customerName ?? undefined,
    token: cart.token,
    itemsCount: cart.itemsCount,
    itemsQuantity: cart.itemsQuantity,
    estimatedTotal: toNumber(cart.estimatedTotal),
    lastEmailSentAt: cart.lastEmailSentAt
      ? formatDateTime(cart.lastEmailSentAt)
      : undefined,
    recoveredAt: cart.recoveredAt ? formatDateTime(cart.recoveredAt) : undefined,
    updatedAt: formatDateTime(cart.updatedAt),
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl ?? undefined,
      categoryName: item.categoryName ?? undefined,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice)
    }))
  }));
}

export async function getAdminBackInStockSubscriptions(): Promise<
  AdminBackInStockSubscription[]
> {
  const subscriptions = await fetchAdmin<BackInStockSubscriptionResponse[]>(
    "/engagement/admin/back-in-stock"
  );

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    email: subscription.email,
    active: subscription.active,
    notifiedAt: subscription.notifiedAt
      ? formatDateTime(subscription.notifiedAt)
      : undefined,
    createdAt: formatDateTime(subscription.createdAt),
    updatedAt: formatDateTime(subscription.updatedAt),
    product: {
      id: subscription.product.id,
      name: subscription.product.name,
      slug: subscription.product.slug,
      stock: subscription.product.stock,
      status: subscription.product.status,
      imageUrl: subscription.product.imageUrl ?? undefined,
      categoryName: subscription.product.categoryName
    }
  }));
}

function normalizeAdminOrder(order: OrderResponse): AdminOrder {
  return {
    id: order.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    couponCode: order.couponCode ?? undefined,
    discountAmount: toNumber(order.discountAmount),
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shippingCost),
    total: toNumber(order.total),
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    recipientName: order.recipientName ?? undefined,
    customerDocument: order.customerDocument ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    shippingAddress: order.shippingAddress,
    shippingNumber: order.shippingNumber ?? undefined,
    shippingAddress2: order.shippingAddress2 ?? undefined,
    shippingNeighborhood: order.shippingNeighborhood ?? undefined,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPostalCode: order.shippingPostalCode,
    trackingCode: order.trackingCode ?? undefined,
    paidAt: order.paidAt ?? undefined,
    shippedAt: order.shippedAt ?? undefined,
    deliveredAt: order.deliveredAt ?? undefined,
    canceledAt: order.canceledAt ?? undefined,
    notes: order.notes ?? undefined,
    paymentMock: order.paymentMock
      ? {
          status: order.paymentMock.status,
          instructions: order.paymentMock.instructions,
          reference: order.paymentMock.reference,
          expiresAt: order.paymentMock.expiresAt ?? undefined,
          qrCode: order.paymentMock.qrCode ?? undefined,
          copyPasteCode: order.paymentMock.copyPasteCode ?? undefined,
          digitableLine: order.paymentMock.digitableLine ?? undefined,
          authorizationCode: order.paymentMock.authorizationCode ?? undefined,
          cardBrand: order.paymentMock.cardBrand ?? undefined,
          installments: order.paymentMock.installments ?? undefined
        }
      : undefined,
    createdAt: formatDate(order.createdAt),
    returnRequests: (order.returnRequests ?? []).map((request) => ({
      id: request.id,
      type: request.type,
      status: request.status,
      financialStatus: request.financialStatus ?? undefined,
      reason: request.reason,
      details: request.details ?? undefined,
      resolutionNote: request.resolutionNote ?? undefined,
      reverseLogisticsCode: request.reverseLogisticsCode ?? undefined,
      reverseShippingLabel: request.reverseShippingLabel ?? undefined,
      returnDestinationAddress: request.returnDestinationAddress ?? undefined,
      reverseInstructions: request.reverseInstructions ?? undefined,
      reverseDeadlineAt: request.reverseDeadlineAt
        ? formatDateTimeInput(request.reverseDeadlineAt)
        : undefined,
      refundAmount: toNumber(request.refundAmount),
      storeCreditAmount: toNumber(request.storeCreditAmount),
      restockItems: request.restockItems === true,
      restockNote: request.restockNote ?? undefined,
      receivedAt: request.receivedAt ? formatDateTime(request.receivedAt) : undefined,
      completedAt: request.completedAt
        ? formatDateTime(request.completedAt)
        : undefined,
      restockedAt: request.restockedAt
        ? formatDateTime(request.restockedAt)
        : undefined,
      selectedItems: (request.selectedItems ?? []).map((item) => ({
        orderItemId: item.orderItemId,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        variantLabel: item.variantLabel ?? undefined,
        quantity: item.quantity
      })),
      createdAt: formatDateTime(request.createdAt),
      updatedAt: formatDateTime(request.updatedAt)
    })),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      variantId: item.variantId ?? undefined,
      sku: item.variantSku ?? undefined,
      variantLabel: item.variantLabel ?? undefined,
      name: item.product.name,
      slug: item.product.slug,
      category: item.product.category?.name ?? "Colecao",
      imageUrl: item.product.imageUrl ?? undefined,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice)
    }))
  };
}

export async function getAdminOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminOrderList> {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedOrdersResponse>(`/orders${suffix}`);

  return {
    items: response.items.map(normalizeAdminOrder),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export async function getAdminReturnRequests(filters?: {
  status?: string;
  type?: string;
  financialStatus?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminReturnRequestList> {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.type) {
    params.set("type", filters.type);
  }

  if (filters?.financialStatus) {
    params.set("financialStatus", filters.financialStatus);
  }

  if (filters?.priority) {
    params.set("priority", filters.priority);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchAdmin<PaginatedReturnRequestsResponse>(
    `/orders/return-requests/admin${suffix}`
  );

  return {
    items: response.items.map((request) => ({
      id: request.id,
      orderId: request.order.id,
      customerId: request.user.id,
      customerName: request.user.name,
      customerEmail: request.user.email,
      orderStatus: request.order.status,
      orderCreatedAt: formatDateTime(request.order.createdAt),
      type: request.type,
      status: request.status,
      financialStatus: request.financialStatus ?? undefined,
      reason: request.reason,
      details: request.details ?? undefined,
      resolutionNote: request.resolutionNote ?? undefined,
      reverseLogisticsCode: request.reverseLogisticsCode ?? undefined,
      reverseShippingLabel: request.reverseShippingLabel ?? undefined,
      returnDestinationAddress: request.returnDestinationAddress ?? undefined,
      reverseInstructions: request.reverseInstructions ?? undefined,
      reverseDeadlineAt: request.reverseDeadlineAt
        ? formatDateTimeInput(request.reverseDeadlineAt)
        : undefined,
      refundAmount: toNumber(request.refundAmount),
      storeCreditAmount: toNumber(request.storeCreditAmount),
      restockItems: request.restockItems,
      restockNote: request.restockNote ?? undefined,
      receivedAt: request.receivedAt ? formatDateTime(request.receivedAt) : undefined,
      completedAt: request.completedAt
        ? formatDateTime(request.completedAt)
        : undefined,
      restockedAt: request.restockedAt
        ? formatDateTime(request.restockedAt)
        : undefined,
      priority: request.priority,
      slaHours: request.slaHours,
      slaLabel: request.slaLabel,
      createdAt: formatDateTime(request.createdAt),
      updatedAt: formatDateTime(request.updatedAt),
      selectedItems: request.selectedItemsDetailed.map((item) => ({
        orderItemId: item.orderItemId,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        variantLabel: item.variantLabel ?? undefined,
        quantity: item.quantity,
        productName: item.productName,
        categoryName: item.categoryName
      }))
    })),
    summary: response.summary,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    totalPages: response.totalPages
  };
}

export type SaveUserInput = {
  name: string;
  email: string;
  password?: string;
  role: string;
};

export async function createAdminUser(payload: Required<SaveUserInput>) {
  return mutateAdmin("/users", "POST", payload);
}

export async function updateAdminUser(id: string, payload: SaveUserInput) {
  return mutateAdmin(`/users/${id}`, "PATCH", payload);
}

export async function deleteAdminUser(id: string) {
  return mutateAdmin(`/users/${id}`, "DELETE");
}

export type SaveProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  compareAt?: number;
  stock: number;
  status: string;
  imageUrl?: string;
  categoryId: string;
  variants?: Array<{
    sku: string;
    color?: string;
    size?: string;
    optionLabel: string;
    priceOverride?: number;
    compareAtOverride?: number;
    stock: number;
    imageUrl?: string;
    isDefault?: boolean;
  }>;
};

export async function createAdminProduct(payload: SaveProductInput) {
  return mutateAdmin("/products", "POST", payload);
}

export async function updateAdminProduct(id: string, payload: SaveProductInput) {
  return mutateAdmin(`/products/${id}`, "PATCH", payload);
}

export async function deleteAdminProduct(id: string) {
  return mutateAdmin(`/products/${id}`, "DELETE");
}

export async function adjustAdminProductStock(
  id: string,
  payload: { quantityDelta: number; reason?: string }
) {
  return mutateAdmin(`/products/${id}/stock-adjustments`, "POST", payload);
}

export type SaveCategoryInput = {
  name: string;
  slug: string;
  description?: string;
};

export async function createAdminCategory(payload: SaveCategoryInput) {
  return mutateAdmin("/categories", "POST", payload);
}

export async function updateAdminCategory(id: string, payload: SaveCategoryInput) {
  return mutateAdmin(`/categories/${id}`, "PATCH", payload);
}

export async function deleteAdminCategory(id: string) {
  return mutateAdmin(`/categories/${id}`, "DELETE");
}

export type SaveCouponInput = {
  code: string;
  description?: string;
  type: string;
  value: number;
  active: boolean;
  minSubtotal?: number;
  usageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
};

export type SaveSettingsInput = {
  storeName: string;
  storeUrl: string;
  supportEmail?: string;
  monthlyRevenueTarget: number;
  minimumMarginTarget: number;
  emailEnabled: boolean;
  emailFrom: string;
  emailReplyTo?: string;
  emailOrdersTo?: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

export async function createAdminCoupon(payload: SaveCouponInput) {
  return mutateAdmin("/coupons", "POST", payload);
}

export async function updateAdminCoupon(id: string, payload: SaveCouponInput) {
  return mutateAdmin(`/coupons/${id}`, "PATCH", payload);
}

export async function updateAdminSettings(payload: SaveSettingsInput) {
  return mutateAdmin("/settings", "PATCH", payload);
}

export async function sendAdminTestEmail(to: string) {
  return mutateAdmin("/settings/test-email", "PATCH", { to });
}

export async function deleteAdminCoupon(id: string) {
  return mutateAdmin(`/coupons/${id}`, "DELETE");
}

export async function updateAdminOrderStatus(
  id: string,
  status: string,
  trackingCode?: string
) {
  return mutateAdmin(`/orders/${id}/status`, "PATCH", {
    status,
    trackingCode: trackingCode?.trim() || undefined
  });
}

export async function updateAdminReturnRequestStatus(
  orderId: string,
  requestId: string,
  status: string,
  payload?: {
    resolutionNote?: string;
    reverseLogisticsCode?: string;
    reverseShippingLabel?: string;
    returnDestinationAddress?: string;
    reverseInstructions?: string;
    reverseDeadlineAt?: string;
    financialStatus?: string;
    refundAmount?: number;
    storeCreditAmount?: number;
    restockItems?: boolean;
    restockNote?: string;
  }
) {
  return mutateAdmin(`/orders/${orderId}/return-requests/${requestId}`, "PATCH", {
    status,
    resolutionNote: payload?.resolutionNote?.trim() || undefined,
    reverseLogisticsCode: payload?.reverseLogisticsCode?.trim() || undefined,
    reverseShippingLabel: payload?.reverseShippingLabel?.trim() || undefined,
    returnDestinationAddress: payload?.returnDestinationAddress?.trim() || undefined,
    reverseInstructions: payload?.reverseInstructions?.trim() || undefined,
    reverseDeadlineAt: payload?.reverseDeadlineAt?.trim() || undefined,
    financialStatus: payload?.financialStatus?.trim() || undefined,
    refundAmount: payload?.refundAmount,
    storeCreditAmount: payload?.storeCreditAmount,
    restockItems: payload?.restockItems,
    restockNote: payload?.restockNote?.trim() || undefined
  });
}

export type CustomerOrder = {
  id: string;
  couponCode?: string;
  discountAmount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  recipientName?: string;
  customerDocument?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingNumber?: string;
  shippingAddress2?: string;
  shippingNeighborhood?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  trackingCode?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  notes?: string;
  paymentMock?: {
    status: string;
    instructions: string;
    reference: string;
    expiresAt?: string;
    qrCode?: string;
    copyPasteCode?: string;
    digitableLine?: string;
    authorizationCode?: string;
    cardBrand?: string;
    installments?: string;
  };
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    variantId?: string;
    sku?: string;
    variantLabel?: string;
    name: string;
    slug: string;
    quantity: number;
    unitPrice: number;
    category: string;
    imageUrl?: string;
  }>;
};

export async function lookupCustomerOrders(email: string): Promise<CustomerOrder[]> {
  const orders = await apiFetch<OrderResponse[]>("/orders/lookup", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  return orders.map((order) => ({
    id: order.id,
    couponCode: order.couponCode ?? undefined,
    discountAmount: toNumber(order.discountAmount),
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shippingCost),
    total: toNumber(order.total),
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    recipientName: order.recipientName ?? undefined,
    customerDocument: order.customerDocument ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    shippingAddress: order.shippingAddress,
    shippingNumber: order.shippingNumber ?? undefined,
    shippingAddress2: order.shippingAddress2 ?? undefined,
    shippingNeighborhood: order.shippingNeighborhood ?? undefined,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPostalCode: order.shippingPostalCode,
    trackingCode: order.trackingCode ?? undefined,
    paidAt: order.paidAt ?? undefined,
    shippedAt: order.shippedAt ?? undefined,
    deliveredAt: order.deliveredAt ?? undefined,
    canceledAt: order.canceledAt ?? undefined,
    notes: order.notes ?? undefined,
    paymentMock: order.paymentMock
      ? {
          status: order.paymentMock.status,
          instructions: order.paymentMock.instructions,
          reference: order.paymentMock.reference,
          expiresAt: order.paymentMock.expiresAt ?? undefined,
          qrCode: order.paymentMock.qrCode ?? undefined,
          copyPasteCode: order.paymentMock.copyPasteCode ?? undefined,
          digitableLine: order.paymentMock.digitableLine ?? undefined,
          authorizationCode: order.paymentMock.authorizationCode ?? undefined,
          cardBrand: order.paymentMock.cardBrand ?? undefined,
          installments: order.paymentMock.installments ?? undefined
        }
      : undefined,
    createdAt: formatDate(order.createdAt),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      variantId: item.variantId ?? undefined,
      sku: item.variantSku ?? undefined,
      variantLabel: item.variantLabel ?? undefined,
      name: item.product.name,
      slug: item.product.slug,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      category: item.product.category?.name ?? "Colecao",
      imageUrl: item.product.imageUrl ?? undefined
    }))
    }));
}

export async function confirmCustomerMockPayment(orderId: string, email: string) {
  return apiFetch<OrderResponse>(`/orders/${orderId}/mock-payment/confirm`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function cancelCustomerOrder(orderId: string, email: string) {
  return apiFetch<OrderResponse>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function validateCoupon(code: string, subtotal: number, shippingCost = 0) {
  return apiFetch<{
    id: string;
    code: string;
    description?: string | null;
    discountAmount: number;
  }>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal, shippingCost })
  });
}
