"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminAuthError,
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory
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

function parsePayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  return {
    name,
    slug: slugify(rawSlug || name),
    description: description || undefined
  };
}

export async function createCategoryAction(formData: FormData) {
  try {
    await createAdminCategory(parsePayload(formData));
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/categorias?error=generic_error");
  }

  redirect("/admin/categorias?success=category_created");
}

export async function updateCategoryAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await updateAdminCategory(id, parsePayload(formData));
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/categorias?error=generic_error");
  }

  redirect("/admin/categorias?success=category_updated");
}

export async function deleteCategoryAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await deleteAdminCategory(id);
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    redirect("/admin/categorias?error=generic_error");
  }

  redirect("/admin/categorias?success=category_deleted");
}
