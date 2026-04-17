"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  updateAdminOrderStatus
} from "@/lib/admin-api";

export async function updateOrderStatusAction(formData: FormData) {
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
      redirect(`/admin/pedidos?error=${error.code}`);
    }

    redirect("/admin/pedidos?error=generic_error");
  }

  redirect("/admin/pedidos?success=order_updated");
}
