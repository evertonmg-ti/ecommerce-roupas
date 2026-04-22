import "server-only";

import { apiFetch } from "@/lib/api";
import { Product, fallbackProducts } from "@/lib/data";

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  compareAt?: number | string | null;
  stock: number;
  status?: string;
  imageUrl?: string | null;
  category?: {
    name: string;
    slug?: string;
  } | null;
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type PublicProductFilters = {
  search?: string;
  category?: string;
  sort?: string;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return undefined;
}

function normalizeProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price) ?? 0,
    compareAt: toNumber(product.compareAt),
    stock: product.stock,
    status: product.status,
    imageUrl: product.imageUrl ?? fallbackProducts[0]?.imageUrl,
    category: product.category?.name ?? "Colecao"
  };
}

function buildProductsPath(filters?: PublicProductFilters) {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.category) {
    params.set("category", filters.category);
  }

  if (filters?.sort) {
    params.set("sort", filters.sort);
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export async function getPublicProducts(filters?: PublicProductFilters) {
  const products = await apiFetch<ApiProduct[]>(buildProductsPath(filters));
  return products.map(normalizeProduct);
}

export async function getFeaturedProducts(limit = 3) {
  const products = await getPublicProducts();
  return products.slice(0, limit);
}

export async function getPublicProductBySlug(slug: string) {
  const product = await apiFetch<ApiProduct>(`/products/${slug}`);
  return normalizeProduct(product);
}

export async function getPublicCategories() {
  const categories = await apiFetch<ApiCategory[]>("/categories");

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined
  }));
}
