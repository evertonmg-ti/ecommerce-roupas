"use server";

import { revalidatePath } from "next/cache";
import { createAdminUser, updateAdminUser } from "@/lib/admin-api";

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
  const payload = parsePayload(formData);
  await createAdminUser({
    name: payload.name,
    email: payload.email,
    password: payload.password ?? "123456",
    role: payload.role
  });
  revalidatePath("/admin/usuarios");
}

export async function updateUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  await updateAdminUser(id, parsePayload(formData));
  revalidatePath("/admin/usuarios");
}
