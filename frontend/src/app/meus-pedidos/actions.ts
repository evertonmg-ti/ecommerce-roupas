"use server";

import { redirect } from "next/navigation";
import { cancelCustomerOrder, confirmCustomerMockPayment } from "@/lib/admin-api";

export async function confirmMockPaymentAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const redirectBase = `/meus-pedidos?email=${encodeURIComponent(email)}`;

  if (!orderId || !email) {
    redirect(`${redirectBase}&error=payment_failed`);
  }

  try {
    await confirmCustomerMockPayment(orderId, email);
  } catch {
    redirect(`${redirectBase}&error=payment_failed`);
  }

  redirect(`${redirectBase}&success=payment_confirmed`);
}

export async function cancelOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const redirectBase = `/meus-pedidos?email=${encodeURIComponent(email)}`;

  if (!orderId || !email) {
    redirect(`${redirectBase}&error=cancel_failed`);
  }

  try {
    await cancelCustomerOrder(orderId, email);
  } catch {
    redirect(`${redirectBase}&error=cancel_failed`);
  }

  redirect(`${redirectBase}&success=order_canceled`);
}
