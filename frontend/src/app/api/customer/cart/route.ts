import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function getAuthHeaders() {
  const session = await getCustomerSession();

  if (!session?.token) {
    return null;
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`
  };
}

export async function GET() {
  const headers = await getAuthHeaders();

  if (!headers) {
    return NextResponse.json({ message: "Sessao do cliente nao encontrada." }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/users/me/cart`, {
    headers,
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({ message: "Falha ao carregar o carrinho." }));

  return NextResponse.json(payload, { status: response.status });
}

export async function PATCH(request: NextRequest) {
  const headers = await getAuthHeaders();

  if (!headers) {
    return NextResponse.json({ message: "Sessao do cliente nao encontrada." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({ items: [] }));
  const response = await fetch(`${API_URL}/users/me/cart`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({ message: "Falha ao salvar o carrinho." }));

  return NextResponse.json(payload, { status: response.status });
}

export async function DELETE() {
  const headers = await getAuthHeaders();

  if (!headers) {
    return NextResponse.json({ message: "Sessao do cliente nao encontrada." }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/users/me/cart`, {
    method: "DELETE",
    headers,
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({ success: response.ok }));

  return NextResponse.json(payload, { status: response.status });
}
