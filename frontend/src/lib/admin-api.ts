import "server-only";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
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
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
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
    redirect("/login");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
    slug: category.slug
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
