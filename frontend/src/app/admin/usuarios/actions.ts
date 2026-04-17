"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser
} from "@/lib/admin-api";

function parsePayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "CUSTOMER").trim();

  return {
    name,
    email,
    password: password || undefined,
    role
  };
}

export async function createUserAction(formData: FormData) {
  try {
    const payload = parsePayload(formData);
    await createAdminUser({
      name: payload.name,
      email: payload.email,
      password: payload.password ?? "123456",
      role: payload.role
    });
    revalidatePath("/admin/usuarios");
  } catch {
    redirect("/admin/usuarios?error=generic_error");
  }

  redirect("/admin/usuarios?success=user_created");
}

export async function updateUserAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await updateAdminUser(id, parsePayload(formData));
    revalidatePath("/admin/usuarios");
  } catch {
    redirect("/admin/usuarios?error=generic_error");
  }

  redirect("/admin/usuarios?success=user_updated");
}

export async function deleteUserAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await deleteAdminUser(id);
    revalidatePath("/admin/usuarios");
  } catch {
    redirect("/admin/usuarios?error=generic_error");
  }

  redirect("/admin/usuarios?success=user_deleted");
}
