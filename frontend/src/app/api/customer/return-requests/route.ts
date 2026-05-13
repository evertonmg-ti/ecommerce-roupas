import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();

  if (!session?.token) {
    return NextResponse.json(
      { message: "Sessao do cliente nao encontrada." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json(
      { message: "Pedido invalido para a solicitacao." },
      { status: 400 }
    );
  }

  const response = await fetch(`${API_URL}/orders/${orderId}/return-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`
    },
    body: JSON.stringify({
      type: body?.type,
      reason: body?.reason,
      details: body?.details,
      items: Array.isArray(body?.items) ? body.items : [],
      attachments: Array.isArray(body?.attachments) ? body.attachments : []
    }),
    cache: "no-store"
  });

  const payload = await response
    .json()
    .catch(() => ({ message: "Falha ao criar a solicitacao de devolucao/troca." }));

  return NextResponse.json(payload, { status: response.status });
}
