"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCurrentCustomerAddress,
  createCurrentCustomerReturnRequestComment,
  createCurrentCustomerReturnRequest,
  deleteCurrentCustomerAddress,
  updateCurrentCustomerAddress,
  updateCurrentCustomerProfile
} from "@/lib/customer-api";

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function parseReturnRequestAttachments(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? "").trim();

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<{
      fileName?: unknown;
      mimeType?: unknown;
      sizeBytes?: unknown;
      dataUrl?: unknown;
    }>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((attachment) => ({
        fileName:
          typeof attachment.fileName === "string" ? attachment.fileName.trim() : "",
        mimeType:
          typeof attachment.mimeType === "string" ? attachment.mimeType.trim() : "",
        sizeBytes:
          typeof attachment.sizeBytes === "number"
            ? attachment.sizeBytes
            : Number(attachment.sizeBytes ?? 0),
        dataUrl: typeof attachment.dataUrl === "string" ? attachment.dataUrl.trim() : ""
      }))
      .filter(
        (attachment) =>
          attachment.fileName &&
          attachment.mimeType &&
          attachment.sizeBytes > 0 &&
          attachment.dataUrl
      );
  } catch {
    return [];
  }
}

export async function updateCustomerProfileAction(formData: FormData) {
  const name = normalizeOptional(formData.get("name"));
  const email = normalizeOptional(formData.get("email"));
  const password = normalizeOptional(formData.get("password"));
  const preferredPaymentMethod = normalizeOptional(formData.get("preferredPaymentMethod"));
  const preferredShippingMethod = normalizeOptional(formData.get("preferredShippingMethod"));

  try {
    await updateCurrentCustomerProfile({
      name,
      email,
      password,
      preferredPaymentMethod,
      preferredShippingMethod
    });
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=profile_update_failed");
  }

  redirect("/conta?success=profile_updated");
}

function parseAddressPayload(formData: FormData) {
  return {
    label: String(formData.get("label") ?? "").trim(),
    recipientName: String(formData.get("recipientName") ?? "").trim(),
    customerDocument: normalizeOptional(formData.get("customerDocument")),
    customerPhone: normalizeOptional(formData.get("customerPhone")),
    shippingAddress: String(formData.get("shippingAddress") ?? "").trim(),
    shippingNumber: String(formData.get("shippingNumber") ?? "").trim(),
    shippingAddress2: normalizeOptional(formData.get("shippingAddress2")),
    shippingNeighborhood: String(formData.get("shippingNeighborhood") ?? "").trim(),
    shippingCity: String(formData.get("shippingCity") ?? "").trim(),
    shippingState: String(formData.get("shippingState") ?? "").trim().toUpperCase(),
    shippingPostalCode: String(formData.get("shippingPostalCode") ?? "").trim(),
    isDefault: formData.get("isDefault") === "on",
    favoriteForStandard: formData.get("favoriteForStandard") === "on",
    favoriteForExpress: formData.get("favoriteForExpress") === "on",
    favoriteForPickup: formData.get("favoriteForPickup") === "on"
  };
}

export async function createCustomerAddressAction(formData: FormData) {
  try {
    await createCurrentCustomerAddress(parseAddressPayload(formData));
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=address_create_failed");
  }

  redirect("/conta?success=address_created");
}

export async function updateCustomerAddressAction(formData: FormData) {
  const addressId = String(formData.get("addressId") ?? "").trim();

  try {
    await updateCurrentCustomerAddress(addressId, parseAddressPayload(formData));
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=address_update_failed");
  }

  redirect("/conta?success=address_updated");
}

export async function deleteCustomerAddressAction(formData: FormData) {
  const addressId = String(formData.get("addressId") ?? "").trim();

  try {
    await deleteCurrentCustomerAddress(addressId);
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=address_delete_failed");
  }

  redirect("/conta?success=address_deleted");
}

export async function createCustomerReturnRequestAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = normalizeOptional(formData.get("details"));
  const attachments = parseReturnRequestAttachments(formData.get("attachmentsPayload"));
  const items = formData
    .getAll("selectedItemIds")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((orderItemId) => ({
      orderItemId,
      quantity: 1
    }));

  if (!orderId || !type || !reason || items.length === 0) {
    redirect("/conta?error=return_request_failed");
  }

  try {
    await createCurrentCustomerReturnRequest(orderId, {
      type,
      reason,
      details,
      items,
      attachments
    });
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=return_request_failed");
  }

  redirect("/conta?success=return_request_created");
}

export async function createCustomerReturnRequestCommentAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!orderId || !requestId || message.length < 3) {
    redirect("/conta?error=return_request_comment_failed");
  }

  try {
    await createCurrentCustomerReturnRequestComment(orderId, requestId, {
      message
    });
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=return_request_comment_failed");
  }

  redirect("/conta?success=return_request_comment_created");
}
