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

export async function POST(request: NextRequest) {
  const headers = await getAuthHeaders();

  if (!headers) {
    return NextResponse.json(
      { message: "Sessao do cliente nao encontrada." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const response = await fetch(`${API_URL}/orders/checkout/customer`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({
    message: "Falha ao concluir o pedido autenticado."
  }));

  return NextResponse.json(payload, { status: response.status });
}
