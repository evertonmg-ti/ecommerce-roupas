const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function validateCoupon(code: string, subtotal: number, shippingCost = 0) {
  const response = await fetch(`${API_URL}/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code, subtotal, shippingCost })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    throw new Error(message ?? "Nao foi possivel validar o cupom.");
  }

  return response.json() as Promise<{
    id: string;
    code: string;
    description?: string | null;
    discountAmount: number;
  }>;
}
