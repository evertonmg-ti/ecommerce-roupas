import "server-only";

import { getCustomerSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type OrderResponse = {
  id: string;
  total: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  trackingCode?: string | null;
  createdAt: string;
  returnRequests?: Array<{
    id: string;
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
    refundAmount?: number | string;
    storeCreditAmount?: number | string;
    restockItems?: boolean | null;
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

type AddressResponse = {
  id: string;
  label: string;
  recipientName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  shippingAddress: string;
  shippingNumber: string;
  shippingAddress2?: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  isDefault: boolean;
  favoriteForStandard: boolean;
  favoriteForExpress: boolean;
  favoriteForPickup: boolean;
  createdAt: string;
};

type CurrentUserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  preferredPaymentMethod?: string | null;
  preferredShippingMethod?: string | null;
  createdAt: string;
  addresses?: AddressResponse[];
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  preferredPaymentMethod?: string;
  preferredShippingMethod?: string;
  createdAt: string;
  addresses: CustomerAddress[];
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  customerDocument?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingNumber: string;
  shippingAddress2?: string;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  isDefault: boolean;
  favoriteForStandard: boolean;
  favoriteForExpress: boolean;
  favoriteForPickup: boolean;
  createdAt: string;
};

export type CustomerOrderSummary = {
  id: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  trackingCode?: string;
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
    imageUrl?: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

async function fetchCustomer<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getCustomerSession();

  if (!session?.token) {
    throw new Error("Sessao do cliente nao encontrada.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    throw new Error(message ?? "Falha na operacao do cliente.");
  }

  return (await response.json()) as T;
}

function normalizeAddress(address: AddressResponse): CustomerAddress {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    customerDocument: address.customerDocument ?? undefined,
    customerPhone: address.customerPhone ?? undefined,
    shippingAddress: address.shippingAddress,
    shippingNumber: address.shippingNumber,
    shippingAddress2: address.shippingAddress2 ?? undefined,
    shippingNeighborhood: address.shippingNeighborhood,
    shippingCity: address.shippingCity,
    shippingState: address.shippingState,
    shippingPostalCode: address.shippingPostalCode,
    isDefault: address.isDefault,
    favoriteForStandard: address.favoriteForStandard,
    favoriteForExpress: address.favoriteForExpress,
    favoriteForPickup: address.favoriteForPickup,
    createdAt: formatDateTime(address.createdAt)
  };
}

export async function getCurrentCustomerAccount(): Promise<CustomerAccount> {
  const user = await fetchCustomer<CurrentUserResponse>("/users/me");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredPaymentMethod: user.preferredPaymentMethod ?? undefined,
    preferredShippingMethod: user.preferredShippingMethod ?? undefined,
    createdAt: formatDateTime(user.createdAt),
    addresses: (user.addresses ?? []).map(normalizeAddress)
  };
}

export async function getCurrentCustomerOrders(): Promise<CustomerOrderSummary[]> {
  const orders = await fetchCustomer<OrderResponse[]>("/orders/me");

  return orders.map((order) => ({
    id: order.id,
    total: toNumber(order.total),
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shippingCost),
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    trackingCode: order.trackingCode ?? undefined,
    createdAt: formatDateTime(order.createdAt),
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
        ? formatDateTime(request.reverseDeadlineAt)
        : undefined,
      refundAmount: toNumber(request.refundAmount ?? 0),
      storeCreditAmount: toNumber(request.storeCreditAmount ?? 0),
      restockItems: request.restockItems === true,
      restockNote: request.restockNote ?? undefined,
      receivedAt: request.receivedAt ? formatDateTime(request.receivedAt) : undefined,
      completedAt: request.completedAt
        ? formatDateTime(request.completedAt)
        : undefined,
      restockedAt: request.restockedAt
        ? formatDateTime(request.restockedAt)
        : undefined,
      selectedItems:
        request.selectedItems?.map((item) => ({
          orderItemId: item.orderItemId,
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          variantLabel: item.variantLabel ?? undefined,
          quantity: item.quantity
        })) ?? [],
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
      imageUrl: item.product.imageUrl ?? undefined,
      category: item.product.category?.name ?? "Colecao",
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice)
    }))
  }));
}

export async function updateCurrentCustomerProfile(payload: {
  name?: string;
  email?: string;
  password?: string;
  preferredPaymentMethod?: string;
  preferredShippingMethod?: string;
}) {
  return fetchCustomer("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function createCurrentCustomerAddress(payload: {
  label: string;
  recipientName: string;
  customerDocument?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingNumber: string;
  shippingAddress2?: string;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  isDefault?: boolean;
  favoriteForStandard?: boolean;
  favoriteForExpress?: boolean;
  favoriteForPickup?: boolean;
}) {
  return fetchCustomer("/users/me/addresses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCurrentCustomerAddress(
  addressId: string,
  payload: {
    label: string;
    recipientName: string;
    customerDocument?: string;
    customerPhone?: string;
    shippingAddress: string;
    shippingNumber: string;
    shippingAddress2?: string;
    shippingNeighborhood: string;
    shippingCity: string;
    shippingState: string;
    shippingPostalCode: string;
    isDefault?: boolean;
    favoriteForStandard?: boolean;
    favoriteForExpress?: boolean;
    favoriteForPickup?: boolean;
  }
) {
  return fetchCustomer(`/users/me/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteCurrentCustomerAddress(addressId: string) {
  return fetchCustomer(`/users/me/addresses/${addressId}`, {
    method: "DELETE"
  });
}

export async function createCurrentCustomerReturnRequest(
  orderId: string,
  payload: {
    type: string;
    reason: string;
    details?: string;
    items: Array<{
      orderItemId: string;
      quantity: number;
    }>;
  }
) {
  return fetchCustomer(`/orders/${orderId}/return-requests`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
