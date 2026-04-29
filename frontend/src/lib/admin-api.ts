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
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
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
  items: Array<{
    id: string;
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
    category: product.category?.name ?? "Sem categoria"
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
    items: order.items.map((item) => ({
      id: item.id,
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
    name: string;
    quantity: number;
    unitPrice: number;
    category: string;
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
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      category: item.product.category?.name ?? "Colecao"
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
