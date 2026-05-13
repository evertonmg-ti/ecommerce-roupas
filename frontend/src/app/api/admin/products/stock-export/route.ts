import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function GET() {
  const session = await getAdminSession();

  if (!session?.token || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Sessao de admin nao encontrada." }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/products/admin/stock-export`, {
    headers: {
      Authorization: `Bearer ${session.token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ message: "Falha ao exportar o estoque." }));

    return NextResponse.json(payload, { status: response.status });
  }

  const payload = (await response.json()) as {
    filename?: string;
    content?: string;
  };
  const fileName = payload.filename?.trim() || "estoque-produtos.csv";

  return new NextResponse(payload.content ?? "", {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
