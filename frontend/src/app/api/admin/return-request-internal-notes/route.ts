import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session?.token || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Sessao de admin nao encontrada." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";

  if (!orderId || !requestId) {
    return NextResponse.json(
      { message: "Solicitacao invalida para comentario interno." },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${API_URL}/orders/${orderId}/return-requests/${requestId}/internal-notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        message: body?.message,
        attachments: Array.isArray(body?.attachments) ? body.attachments : []
      }),
      cache: "no-store"
    }
  );

  const payload = await response
    .json()
    .catch(() => ({ message: "Falha ao registrar comentario interno." }));

  return NextResponse.json(payload, { status: response.status });
}
