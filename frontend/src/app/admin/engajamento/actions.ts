"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  AdminRequestError,
  resendAdminAbandonedCartReminder,
  sendAdminWalletBalanceReminder,
  triggerAdminAbandonedCartCampaign,
  triggerAdminWalletReminderCampaign
} from "@/lib/admin-api";

export async function resendAbandonedCartReminderAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await resendAdminAbandonedCartReminder(id);
    revalidatePath("/admin/engajamento");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/engajamento?error=${error.code}`);
    }

    redirect("/admin/engajamento?error=generic_error");
  }

  redirect("/admin/engajamento?success=campaign_sent");
}

export async function sendWalletReminderAction(formData: FormData) {
  try {
    const userId = String(formData.get("userId") ?? "").trim();
    await sendAdminWalletBalanceReminder(userId);
    revalidatePath("/admin/engajamento");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/engajamento?error=${error.code}`);
    }

    redirect("/admin/engajamento?error=generic_error");
  }

  redirect("/admin/engajamento?success=campaign_sent");
}

export async function triggerAbandonedCartCampaignAction(formData: FormData) {
  try {
    const stage = String(formData.get("stage") ?? "").trim();
    await triggerAdminAbandonedCartCampaign(
      stage === "THIRD_TOUCH" ? "THIRD_TOUCH" : "SECOND_TOUCH"
    );
    revalidatePath("/admin/engajamento");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/engajamento?error=${error.code}`);
    }

    redirect("/admin/engajamento?error=generic_error");
  }

  redirect("/admin/engajamento?success=campaign_sent");
}

export async function triggerWalletReminderCampaignAction(formData: FormData) {
  try {
    const segment = String(formData.get("segment") ?? "").trim();
    await triggerAdminWalletReminderCampaign(
      segment === "DORMANT_30_DAYS" ? "DORMANT_30_DAYS" : "DORMANT_7_DAYS"
    );
    revalidatePath("/admin/engajamento");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/engajamento?error=${error.code}`);
    }

    redirect("/admin/engajamento?error=generic_error");
  }

  redirect("/admin/engajamento?success=campaign_sent");
}
