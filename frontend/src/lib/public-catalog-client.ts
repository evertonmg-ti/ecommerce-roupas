import { apiFetch } from "@/lib/api";
import { CartItem } from "@/lib/cart";

export type CatalogRecommendation = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
};

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  imageUrl?: string | null;
  stock: number;
  category?: {
    name: string;
    slug?: string;
  } | null;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function normalizeProduct(product: ApiProduct): CatalogRecommendation {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price),
    imageUrl: product.imageUrl ?? undefined,
    category: product.category?.name ?? "Colecao",
    stock: product.stock
  };
}

export async function getCartUpsellRecommendations(items: CartItem[], limit = 3) {
  const category = items[0]?.category;
  const params = new URLSearchParams();

  if (category) {
    params.set("search", category);
  }

  params.set("sort", "newest");
  const products = await apiFetch<ApiProduct[]>(`/products?${params.toString()}`);
  const excludedIds = new Set(items.map((item) => item.id));

  return products
    .map(normalizeProduct)
    .filter((product) => !excludedIds.has(product.id) && product.stock > 0)
    .slice(0, limit);
}
