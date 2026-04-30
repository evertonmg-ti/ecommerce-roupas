"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  updateAdminOrderStatus,
  updateAdminReturnRequestStatus
} from "@/lib/admin-api";

export async function updateOrderStatusAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/pedidos");

  try {
    const id = String(formData.get("id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const trackingCode = String(formData.get("trackingCode") ?? "").trim();
    await updateAdminOrderStatus(id, status, trackingCode);
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(appendQueryParam(returnTo, "error", error.code));
    }

    redirect(appendQueryParam(returnTo, "error", "generic_error"));
  }

  redirect(appendQueryParam(returnTo, "success", "order_updated"));
}

export async function updateReturnRequestStatusAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/pedidos");

  try {
    const orderId = String(formData.get("orderId") ?? "").trim();
    const requestId = String(formData.get("requestId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();
    const reverseLogisticsCode = String(formData.get("reverseLogisticsCode") ?? "").trim();
    const reverseShippingLabel = String(formData.get("reverseShippingLabel") ?? "").trim();
    const returnDestinationAddress = String(
      formData.get("returnDestinationAddress") ?? ""
    ).trim();
    const reverseInstructions = String(formData.get("reverseInstructions") ?? "").trim();
    const reverseDeadlineAt = String(formData.get("reverseDeadlineAt") ?? "").trim();
    const financialStatus = String(formData.get("financialStatus") ?? "").trim();
    const refundAmountValue = String(formData.get("refundAmount") ?? "").trim();
    const storeCreditAmountValue = String(formData.get("storeCreditAmount") ?? "").trim();
    const restockItems = formData.get("restockItems") === "on";
    const restockNote = String(formData.get("restockNote") ?? "").trim();
    await updateAdminReturnRequestStatus(orderId, requestId, status, {
      resolutionNote,
      reverseLogisticsCode,
      reverseShippingLabel,
      returnDestinationAddress,
      reverseInstructions,
      reverseDeadlineAt,
      financialStatus,
      refundAmount: refundAmountValue ? Number(refundAmountValue) : undefined,
      storeCreditAmount: storeCreditAmountValue
        ? Number(storeCreditAmountValue)
        : undefined,
      restockItems,
      restockNote
    });
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    revalidatePath("/conta");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(appendQueryParam(returnTo, "error", error.code));
    }

    redirect(appendQueryParam(returnTo, "error", "generic_error"));
  }

  redirect(appendQueryParam(returnTo, "success", "return_request_updated"));
}

function appendQueryParam(path: string, key: string, value: string) {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.delete("error");
  params.delete("success");
  params.set(key, value);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
