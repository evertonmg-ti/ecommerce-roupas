"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct
} from "@/lib/admin-api";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized.replace(",", "."));
}

function parsePayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  const stock = Number(String(formData.get("stock") ?? "0"));
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const compareAt = parseOptionalNumber(formData.get("compareAt"));

  return {
    name,
    slug: slugify(rawSlug || name),
    description,
    price,
    compareAt,
    stock,
    status,
    categoryId,
    imageUrl: imageUrl || undefined
  };
}

export async function createProductAction(formData: FormData) {
  try {
    const payload = parsePayload(formData);
    await createAdminProduct(payload);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_created");
}

export async function updateProductAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const payload = parsePayload(formData);
    await updateAdminProduct(id, payload);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath(`/produtos/${payload.slug}`);
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_updated");
}

export async function deleteProductAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await deleteAdminProduct(id);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_deleted");
}
