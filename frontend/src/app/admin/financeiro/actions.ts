"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  adjustAdminCustomerCredit
} from "@/lib/admin-api";

export async function adjustCustomerCreditAction(formData: FormData) {
  try {
    const userId = String(formData.get("userId") ?? "").trim();
    const amountValue = String(formData.get("amount") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    await adjustAdminCustomerCredit(userId, {
      amount: Number(amountValue),
      description: description || undefined
    });
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/usuarios");
    revalidatePath("/conta");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/financeiro?error=${error.code}`);
    }

    redirect("/admin/financeiro?error=generic_error");
  }

  redirect("/admin/financeiro?success=credit_adjusted");
}
