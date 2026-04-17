import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_NAME_COOKIE,
  ADMIN_ROLE_COOKIE,
  ADMIN_TOKEN_COOKIE
} from "@/lib/auth-constants";

export type AdminSession = {
  token: string;
  role: string;
  name?: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_TOKEN_COOKIE)?.value;
  const role = store.get(ADMIN_ROLE_COOKIE)?.value;
  const name = store.get(ADMIN_NAME_COOKIE)?.value;

  if (!token || !role) {
    return null;
  }

  return { token, role, name };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return session;
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_TOKEN_COOKIE);
  store.delete(ADMIN_ROLE_COOKIE);
  store.delete(ADMIN_NAME_COOKIE);
}
