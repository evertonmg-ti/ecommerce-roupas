"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  updateAdminOrderStatus
} from "@/lib/admin-api";

export async function updateOrderStatusAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/pedidos");

  try {
    const id = String(formData.get("id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    await updateAdminOrderStatus(id, status);
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

function appendQueryParam(path: string, key: string, value: string) {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.delete("error");
  params.delete("success");
  params.set(key, value);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
