import { apiFetch } from "@/lib/api";

export type SavedAbandonedCart = {
  id: string;
  email: string;
  customerName?: string;
  token: string;
  items: Array<{
    productId: string;
    variantId?: string;
    variantSku?: string;
    variantLabel?: string;
    productName: string;
    productSlug: string;
    imageUrl?: string | null;
    categoryName?: string | null;
    quantity: number;
    unitPrice: number;
    availableStock: number;
    status: string;
  }>;
};

export async function saveAbandonedCart(payload: {
  email: string;
  customerName?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    variantSku?: string;
    variantLabel?: string;
    productName: string;
    productSlug: string;
    imageUrl?: string;
    categoryName?: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  return apiFetch<{ id: string; token: string }>("/engagement/abandoned-carts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getSavedAbandonedCart(token: string) {
  return apiFetch<SavedAbandonedCart>(`/engagement/abandoned-carts/${token}`);
}

export async function subscribeBackInStock(productId: string, email: string) {
  return apiFetch<{ id: string }>(`/engagement/products/${productId}/back-in-stock`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}
