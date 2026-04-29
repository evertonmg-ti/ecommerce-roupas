"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adjustAdminProductStock,
  AdminAuthError,
  AdminRequestError,
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct
} from "@/lib/admin-api";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized.replace(",", "."));
}

function parseVariants(rawValue: string) {
  const normalized = rawValue.trim();

  if (!normalized) {
    return undefined;
  }

  const variants = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [sku, color, size, optionLabel, price, compareAt, stock, imageUrl, isDefault] =
        line.split("|").map((part) => part.trim());

      if (!sku || !optionLabel || !stock) {
        return null;
      }

      return {
        sku,
        color: color || undefined,
        size: size || undefined,
        optionLabel,
        priceOverride: price ? Number(price.replace(",", ".")) : undefined,
        compareAtOverride: compareAt
          ? Number(compareAt.replace(",", "."))
          : undefined,
        stock: Number(stock),
        imageUrl: imageUrl || undefined,
        isDefault:
          isDefault?.toLowerCase() === "default" ||
          isDefault?.toLowerCase() === "sim" ||
          index === 0
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return variants.length > 0 ? variants : undefined;
}

function parsePayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "0").replace(",", "."));
  const costPrice = Number(
    String(formData.get("costPrice") ?? "0").replace(",", ".")
  );
  const stock = Number(String(formData.get("stock") ?? "0"));
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const compareAt = parseOptionalNumber(formData.get("compareAt"));
  const variants = parseVariants(String(formData.get("variants") ?? ""));

  return {
    name,
    slug: slugify(rawSlug || name),
    description,
    price,
    costPrice,
    compareAt,
    stock,
    status,
    categoryId,
    imageUrl: imageUrl || undefined,
    variants
  };
}

export async function createProductAction(formData: FormData) {
  try {
    const payload = parsePayload(formData);
    await createAdminProduct(payload);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/produtos?error=${error.code}`);
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_created");
}

export async function updateProductAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const payload = parsePayload(formData);
    await updateAdminProduct(id, payload);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath(`/produtos/${payload.slug}`);
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/produtos?error=${error.code}`);
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_updated");
}

export async function deleteProductAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    await deleteAdminProduct(id);
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/produtos?error=${error.code}`);
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=product_deleted");
}

export async function adjustProductStockAction(formData: FormData) {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const quantityDelta = Number(String(formData.get("quantityDelta") ?? "0"));
    const reason = String(formData.get("reason") ?? "").trim();
    await adjustAdminProductStock(id, {
      quantityDelta,
      reason: reason || undefined
    });
    revalidatePath("/admin/produtos");
    revalidatePath("/admin/estoque");
    revalidatePath("/admin");
    revalidatePath("/produtos");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminRequestError) {
      redirect(`/admin/produtos?error=${error.code}`);
    }

    redirect("/admin/produtos?error=generic_error");
  }

  redirect("/admin/produtos?success=stock_adjusted");
}
