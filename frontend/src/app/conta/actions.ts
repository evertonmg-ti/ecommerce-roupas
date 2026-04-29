"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCurrentCustomerAddress,
  createCurrentCustomerReturnRequest,
  deleteCurrentCustomerAddress,
  updateCurrentCustomerAddress,
  updateCurrentCustomerProfile
} from "@/lib/customer-api";

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
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
      items
    });
    revalidatePath("/conta");
  } catch {
    redirect("/conta?error=return_request_failed");
  }

  redirect("/conta?success=return_request_created");
}
