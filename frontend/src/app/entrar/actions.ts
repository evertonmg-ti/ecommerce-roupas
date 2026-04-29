"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CUSTOMER_NAME_COOKIE,
  CUSTOMER_ROLE_COOKIE,
  CUSTOMER_TOKEN_COOKIE
} from "@/lib/auth-constants";
import { clearCustomerSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type CustomerLoginState = {
  error?: string;
};

type LoginResponse = {
  accessToken: string;
  user: {
    name: string;
    role: string;
  };
};

export async function customerLoginAction(
  _prevState: CustomerLoginState,
  formData: FormData
): Promise<CustomerLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/conta");

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
    return { error: "Credenciais invalidas." };
  }

  const data = (await response.json()) as LoginResponse;
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(CUSTOMER_TOKEN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });
  store.set(CUSTOMER_ROLE_COOKIE, data.user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });
  store.set(CUSTOMER_NAME_COOKIE, data.user.name, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect(redirectTo || "/conta");
}

export async function customerLogoutAction() {
  await clearCustomerSession();
  redirect("/entrar");
}
