const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ShippingQuote = {
  shippingMethod: string;
  postalCode: string;
  shippingCost: number;
  estimatedDays: string;
  regionLabel: string;
  freeShippingApplied: boolean;
};

export async function calculateShippingQuote(
  shippingMethod: string,
  postalCode: string,
  subtotal: number
) {
  const response = await fetch(`${API_URL}/orders/shipping-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ shippingMethod, postalCode, subtotal })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    throw new Error(message ?? "Nao foi possivel calcular o frete.");
  }

  return response.json() as Promise<ShippingQuote>;
}
