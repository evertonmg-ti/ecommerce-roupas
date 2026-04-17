"use server";

import { revalidatePath } from "next/cache";
import {
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
  await createAdminCategory(parsePayload(formData));
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
}

export async function updateCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  await updateAdminCategory(id, parsePayload(formData));
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  await deleteAdminCategory(id);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
}

