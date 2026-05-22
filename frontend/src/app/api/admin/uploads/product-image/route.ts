import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);
const maxFileSizeBytes = 5 * 1024 * 1024;

function resolveExtension(file: File) {
  const originalExtension = path.extname(file.name).toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/jpeg":
    default:
      return ".jpg";
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Sessao administrativa invalida." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Nenhum arquivo valido foi enviado." },
      { status: 400 }
    );
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { message: "Envie uma imagem JPG, PNG, WEBP, GIF ou AVIF." },
      { status: 400 }
    );
  }

  if (file.size > maxFileSizeBytes) {
    return NextResponse.json(
      { message: "A imagem deve ter no maximo 5 MB." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
  const fileName = `${Date.now()}-${randomUUID()}${resolveExtension(file)}`;
  const filePath = path.join(uploadDirectory, fileName);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(filePath, buffer);

  return NextResponse.json({
    url: `/uploads/products/${fileName}`
  });
}
