"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  updateAdminSettings
} from "@/lib/admin-api";

function parsePayload(formData: FormData) {
  const storeName = String(formData.get("storeName") ?? "").trim();
  const storeUrl = String(formData.get("storeUrl") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();
  const emailFrom = String(formData.get("emailFrom") ?? "").trim();
  const emailReplyTo = String(formData.get("emailReplyTo") ?? "").trim();
  const emailOrdersTo = String(formData.get("emailOrdersTo") ?? "").trim();
  const smtpHost = String(formData.get("smtpHost") ?? "").trim();
  const smtpPort = Number(String(formData.get("smtpPort") ?? "587"));
  const smtpUser = String(formData.get("smtpUser") ?? "").trim();
  const smtpPass = String(formData.get("smtpPass") ?? "").trim();

  return {
    storeName,
    storeUrl,
    supportEmail: supportEmail || undefined,
    emailEnabled: formData.get("emailEnabled") === "on",
    emailFrom,
    emailReplyTo: emailReplyTo || undefined,
    emailOrdersTo: emailOrdersTo || undefined,
    smtpHost: smtpHost || undefined,
    smtpPort,
    smtpSecure: formData.get("smtpSecure") === "on",
    smtpUser: smtpUser || undefined,
    smtpPass: smtpPass || undefined
  };
}

export async function updateSettingsAction(formData: FormData) {
  try {
    await updateAdminSettings(parsePayload(formData));
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

  redirect("/admin/configuracoes?success=settings_updated");
}
