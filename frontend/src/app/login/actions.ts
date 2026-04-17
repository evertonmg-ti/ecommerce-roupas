"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_NAME_COOKIE,
  ADMIN_ROLE_COOKIE,
  ADMIN_TOKEN_COOKIE
} from "@/lib/auth-constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type LoginFormState = {
  error?: string;
};

type LoginResponse = {
  accessToken: string;
  user: {
    name: string;
    role: string;
  };
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");

  if (!email || !password) {
    return { error: "Informe email e senha para entrar." };
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    return { error: "Credenciais invalidas ou acesso nao autorizado." };
  }

  const data = (await response.json()) as LoginResponse;

  if (data.user.role !== "ADMIN") {
    return { error: "Este acesso e restrito a administradores." };
  }

  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(ADMIN_TOKEN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });
  store.set(ADMIN_ROLE_COOKIE, data.user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });
  store.set(ADMIN_NAME_COOKIE, data.user.name, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect(redirectTo || "/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_TOKEN_COOKIE);
  store.delete(ADMIN_ROLE_COOKIE);
  store.delete(ADMIN_NAME_COOKIE);
  redirect("/login");
}
