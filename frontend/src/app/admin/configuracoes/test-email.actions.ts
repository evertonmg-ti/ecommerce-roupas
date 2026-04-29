"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  sendAdminTestEmail
} from "@/lib/admin-api";

export async function sendTestEmailAction(formData: FormData) {
  try {
    const to = String(formData.get("testEmailTo") ?? "").trim();
    await sendAdminTestEmail(to);
    revalidatePath("/admin/configuracoes");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/configuracoes?error=${error.code}`);
    }

    redirect("/admin/configuracoes?error=generic_error");
  }

  redirect("/admin/configuracoes?success=test_email_sent");
}
