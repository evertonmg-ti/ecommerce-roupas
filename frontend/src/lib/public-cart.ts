import { CartItem, clampCartQuantity } from "@/lib/cart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type ApiAvailabilityProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  imageUrl?: string | null;
  category?: {
    name: string;
  } | null;
};

type ApiAvailabilityItem = {
  productId: string;
  requestedQuantity: number;
  adjustedQuantity: number;
  availableStock: number;
  available: boolean;
  status: "ok" | "adjusted" | "unavailable";
  message: string;
  product?: ApiAvailabilityProduct;
};

type ApiAvailabilityResponse = {
  items: ApiAvailabilityItem[];
  canCheckout: boolean;
  subtotal: number;
};

export type CartAvailabilityIssue = {
  type: "adjusted" | "removed";
  productId: string;
  name: string;
  message: string;
};

export type CartAvailabilityResult = {
  items: CartItem[];
  issues: CartAvailabilityIssue[];
  canCheckout: boolean;
  subtotal: number;
};

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

export async function validateCartAvailability(items: CartItem[]) {
  const response = await fetch(`${API_URL}/products/availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity
      }))
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    throw new Error(message ?? "Nao foi possivel validar o estoque do carrinho.");
  }

  return (await response.json()) as ApiAvailabilityResponse;
}

export function reconcileCartWithAvailability(
  currentItems: CartItem[],
  availability: ApiAvailabilityResponse
): CartAvailabilityResult {
  const currentMap = new Map(currentItems.map((item) => [item.id, item]));
  const nextItems: CartItem[] = [];
  const issues: CartAvailabilityIssue[] = [];

  for (const item of availability.items) {
    const current = currentMap.get(item.productId);
    const name = item.product?.name ?? current?.name ?? "Produto";

    if (!current) {
      continue;
    }

    if (!item.available || item.adjustedQuantity <= 0 || !item.product) {
      issues.push({
        type: "removed",
        productId: item.productId,
        name,
        message: item.message
      });
      continue;
    }

    const nextQuantity = clampCartQuantity(
      item.adjustedQuantity,
      item.availableStock
    );

    if (item.status === "adjusted" || nextQuantity !== current.quantity) {
      issues.push({
        type: "adjusted",
        productId: item.productId,
        name,
        message: item.message
      });
    }

    nextItems.push({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: toNumber(item.product.price),
      imageUrl: item.product.imageUrl ?? current.imageUrl,
      category: item.product.category?.name ?? current.category,
      stock: item.availableStock,
      quantity: nextQuantity
    });
  }

  return {
    items: nextItems,
    issues,
    canCheckout: availability.canCheckout && nextItems.length > 0,
    subtotal: availability.subtotal
  };
}
