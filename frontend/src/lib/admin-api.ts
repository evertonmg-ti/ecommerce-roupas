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
};

type ProductResponse = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  compareAt?: number | string | null;
  stock: number;
  status: string;
  imageUrl?: string | null;
  categoryId: string;
  category?: {
    name: string;
  } | null;
};

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type OrderResponse = {
  id: string;
  total: number | string;
  status: string;
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

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAt?: number;
  stock: number;
  status: string;
  imageUrl?: string;
  categoryId: string;
  category: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
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

export async function getAdminDashboardMetrics(): Promise<AdminMetric[]> {
  const data = await fetchAdmin<DashboardResponse>("/dashboard/summary");

  return [
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
      detail: "Itens cadastrados no catalogo"
    },
    {
      label: "Clientes",
      value: String(data.users),
      detail: "Usuarios criados na plataforma"
    }
  ];
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const products = await fetchAdmin<ProductResponse[]>("/products/admin");

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price),
    compareAt:
      product.compareAt === null || product.compareAt === undefined
        ? undefined
        : toNumber(product.compareAt),
    stock: product.stock,
    status: product.status,
    imageUrl: product.imageUrl ?? undefined,
    categoryId: product.categoryId,
    category: product.category?.name ?? "Sem categoria"
  }));
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

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const orders = await fetchAdmin<OrderResponse[]>("/orders");

  return orders.map((order) => ({
    id: order.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    total: toNumber(order.total),
    status: order.status,
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
  }));
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

export async function updateAdminOrderStatus(id: string, status: string) {
  return mutateAdmin(`/orders/${id}/status`, "PATCH", { status });
}
