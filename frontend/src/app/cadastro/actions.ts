"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CUSTOMER_NAME_COOKIE,
  CUSTOMER_ROLE_COOKIE,
  CUSTOMER_TOKEN_COOKIE
} from "@/lib/auth-constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type CustomerRegisterState = {
  error?: string;
};

type RegisterResponse = {
  accessToken: string;
  user: {
    name: string;
    role: string;
  };
};

export async function customerRegisterAction(
  _prevState: CustomerRegisterState,
  formData: FormData
): Promise<CustomerRegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !password) {
    return { error: "Preencha nome, email e senha." };
  }

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;
    return { error: message ?? "Nao foi possivel criar a conta." };
  }

  const data = (await response.json()) as RegisterResponse;
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

  redirect("/conta");
}
