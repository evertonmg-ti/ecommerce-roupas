"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  createAdminCoupon,
  deleteAdminCoupon,
  updateAdminCoupon
} from "@/lib/admin-api";

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePayload(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    description: String(formData.get("description") ?? "").trim() || undefined,
    type: String(formData.get("type") ?? "PERCENTAGE").trim(),
    value: parseNumber(formData.get("value")) ?? 0,
    active: String(formData.get("active") ?? "true") === "true",
    minSubtotal: parseNumber(formData.get("minSubtotal")),
    usageLimit: parseNumber(formData.get("usageLimit")),
    startsAt: String(formData.get("startsAt") ?? "").trim() || undefined,
    expiresAt: String(formData.get("expiresAt") ?? "").trim() || undefined
  };
}

export async function createCouponAction(formData: FormData) {
  try {
    await createAdminCoupon(parsePayload(formData));
    revalidatePath("/admin/cupons");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/cupons?error=${error.code}`);
    }

    redirect("/admin/cupons?error=generic_error");
  }

  redirect("/admin/cupons?success=coupon_created");
}

export async function updateCouponAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await updateAdminCoupon(id, parsePayload(formData));
    revalidatePath("/admin/cupons");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/cupons?error=${error.code}`);
    }

    redirect("/admin/cupons?error=generic_error");
  }

  redirect("/admin/cupons?success=coupon_updated");
}

export async function deleteCouponAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await deleteAdminCoupon(id);
    revalidatePath("/admin/cupons");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/cupons?error=${error.code}`);
    }

    redirect("/admin/cupons?error=generic_error");
  }

  redirect("/admin/cupons?success=coupon_deleted");
}
