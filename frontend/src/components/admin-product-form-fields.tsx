"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminCategory, AdminProduct } from "@/lib/admin-api";
import { currency } from "@/lib/utils";

type StatusOption = {
  value: string;
  label: string;
};

type ProductVariantForm = {
  id: string;
  sku: string;
  color: string;
  size: string;
  optionLabel: string;
  priceOverride: string;
  compareAtOverride: string;
  stock: string;
  imageUrl: string;
  isDefault: boolean;
};

type AdminProductFormFieldsProps = {
  categories: AdminCategory[];
  statusOptions: StatusOption[];
  product?: AdminProduct;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";

function formatNumberInput(value?: number) {
  return value === undefined ? "" : String(value);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function skuify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createVariant(): ProductVariantForm {
  return {
    id: crypto.randomUUID(),
    sku: "",
    color: "",
    size: "",
    optionLabel: "",
    priceOverride: "",
    compareAtOverride: "",
    stock: "0",
    imageUrl: "",
    isDefault: false
  };
}

function buildInitialVariants(product?: AdminProduct) {
  if (!product || product.variants.length === 0) {
    return [];
  }

  return product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    color: variant.color ?? "",
    size: variant.size ?? "",
    optionLabel: variant.optionLabel,
    priceOverride: formatNumberInput(variant.priceOverride),
    compareAtOverride: formatNumberInput(variant.compareAtOverride),
    stock: String(variant.stock),
    imageUrl: variant.imageUrl ?? "",
    isDefault: variant.isDefault
  }));
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads/product-image", {
    method: "POST",
    body: formData
  });
  const payload = (await response.json().catch(() => null)) as
    | { url?: string; message?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.message ?? "Nao foi possivel enviar a imagem.");
  }

  return payload.url;
}

export function AdminProductFormFields({
  categories,
  statusOptions,
  product
}: AdminProductFormFieldsProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(formatNumberInput(product?.price));
  const [costPrice, setCostPrice] = useState(formatNumberInput(product?.costPrice));
  const [compareAt, setCompareAt] = useState(formatNumberInput(product?.compareAt));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [status, setStatus] = useState(product?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [variants, setVariants] = useState<ProductVariantForm[]>(
    buildInitialVariants(product)
  );
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [mainImageError, setMainImageError] = useState<string | null>(null);
  const [variantUploadState, setVariantUploadState] = useState<Record<string, boolean>>({});
  const [variantUploadError, setVariantUploadError] = useState<Record<string, string | null>>({});
  const mainImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (slugTouched) {
      return;
    }

    setSlug(slugify(name));
  }, [name, slugTouched]);

  const variantsStock = useMemo(
    () =>
      variants.reduce((sum, variant) => {
        const amount = Number(variant.stock);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [variants]
  );
  const effectiveStock = variants.length > 0 ? variantsStock : Number(stock) || 0;
  const galleryImages = useMemo(
    () =>
      [imageUrl, ...variants.map((variant) => variant.imageUrl)]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index),
    [imageUrl, variants]
  );
  const serializedVariants = useMemo(
    () =>
      variants
        .filter((variant) => variant.sku.trim() && variant.optionLabel.trim())
        .map((variant, index) =>
          [
            variant.sku.trim(),
            variant.color.trim(),
            variant.size.trim(),
            variant.optionLabel.trim(),
            variant.priceOverride.trim(),
            variant.compareAtOverride.trim(),
            variant.stock.trim() || "0",
            variant.imageUrl.trim(),
            variant.isDefault || index === 0 ? "default" : ""
          ].join("|")
        )
        .join("\n"),
    [variants]
  );

  async function handleMainImageSelected(file?: File | null) {
    if (!file) {
      return;
    }

    try {
      setMainImageUploading(true);
      setMainImageError(null);
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (error) {
      setMainImageError(
        error instanceof Error ? error.message : "Falha ao enviar a imagem principal."
      );
    } finally {
      setMainImageUploading(false);
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = "";
      }
    }
  }

  async function handleVariantImageSelected(variantId: string, file?: File | null) {
    if (!file) {
      return;
    }

    try {
      setVariantUploadState((current) => ({ ...current, [variantId]: true }));
      setVariantUploadError((current) => ({ ...current, [variantId]: null }));
      const url = await uploadImage(file);
      setVariants((current) =>
        current.map((variant) =>
          variant.id === variantId ? { ...variant, imageUrl: url } : variant
        )
      );
    } catch (error) {
      setVariantUploadError((current) => ({
        ...current,
        [variantId]:
          error instanceof Error ? error.message : "Falha ao enviar a imagem da variacao."
      }));
    } finally {
      setVariantUploadState((current) => ({ ...current, [variantId]: false }));
    }
  }

  function updateVariant(
    variantId: string,
    key: keyof ProductVariantForm,
    value: string | boolean
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === variantId ? { ...variant, [key]: value } : variant
      )
    );
  }

  function setDefaultVariant(variantId: string) {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        isDefault: variant.id === variantId
      }))
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        ...createVariant(),
        isDefault: current.length === 0
      }
    ]);
  }

  function addSizeTemplate() {
    const sizeTemplate = ["P", "M", "G", "GG"];
    const existingSizes = new Set(
      variants.map((variant) => variant.size.trim().toUpperCase()).filter(Boolean)
    );
    const baseSku = skuify(slug || name || "PRODUTO");
    const baseColor = variants.find((variant) => variant.color.trim())?.color.trim() ?? "";

    const newVariants = sizeTemplate
      .filter((size) => !existingSizes.has(size))
      .map((size, index) => ({
        ...createVariant(),
        sku: `${baseSku}-${size}`,
        color: baseColor,
        size,
        optionLabel: baseColor ? `${baseColor} / ${size}` : size,
        stock: "0",
        isDefault: variants.length === 0 && index === 0
      }));

    if (newVariants.length === 0) {
      return;
    }

    setVariants((current) => [...current, ...newVariants]);
  }

  function addNumericSizeTemplate() {
    const sizeTemplate = ["36", "38", "40", "42", "44"];
    const existingSizes = new Set(
      variants.map((variant) => variant.size.trim().toUpperCase()).filter(Boolean)
    );
    const baseSku = skuify(slug || name || "PRODUTO");
    const baseColor = variants.find((variant) => variant.color.trim())?.color.trim() ?? "";

    const newVariants = sizeTemplate
      .filter((size) => !existingSizes.has(size))
      .map((size, index) => ({
        ...createVariant(),
        sku: `${baseSku}-${size}`,
        color: baseColor,
        size,
        optionLabel: baseColor ? `${baseColor} / ${size}` : size,
        stock: "0",
        isDefault: variants.length === 0 && index === 0
      }));

    if (newVariants.length === 0) {
      return;
    }

    setVariants((current) => [...current, ...newVariants]);
  }

  function normalizeVariantData() {
    const baseSku = skuify(slug || name || "PRODUTO");

    setVariants((current) =>
      current.map((variant, index) => {
        const normalizedColor = variant.color.trim();
        const normalizedSize = variant.size.trim();
        const generatedLabel =
          normalizedColor && normalizedSize
            ? `${normalizedColor} / ${normalizedSize}`
            : normalizedColor || normalizedSize || variant.optionLabel.trim();
        const generatedSkuParts = [
          baseSku,
          skuify(normalizedColor),
          skuify(normalizedSize)
        ].filter(Boolean);

        return {
          ...variant,
          sku: variant.sku.trim() || generatedSkuParts.join("-") || `${baseSku}-${index + 1}`,
          optionLabel: variant.optionLabel.trim() || generatedLabel || `Variacao ${index + 1}`
        };
      })
    );
  }

  function copyMainImageToVariants() {
    if (!imageUrl.trim()) {
      return;
    }

    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        imageUrl: variant.imageUrl.trim() || imageUrl.trim()
      }))
    );
  }

  function removeVariant(variantId: string) {
    setVariants((current) => {
      const nextVariants = current.filter((variant) => variant.id !== variantId);

      if (nextVariants.length > 0 && !nextVariants.some((variant) => variant.isDefault)) {
        nextVariants[0] = { ...nextVariants[0], isDefault: true };
      }

      return nextVariants;
    });
  }

  return (
    <div className="grid gap-5">
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <textarea name="variants" value={serializedVariants} readOnly hidden />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Nome</span>
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={3}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Camiseta Studio"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Slug</span>
            <input
              name="slug"
              value={slug}
              onChange={(event) => {
                const value = event.target.value;
                setSlug(value);
                setSlugTouched(value.trim().length > 0);
              }}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="camiseta-studio"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span>Descricao</span>
            <textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={12}
              rows={4}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
              placeholder="Descreva o produto para a vitrine."
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Preco</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Custo unitario</span>
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(event) => setCostPrice(event.target.value)}
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Preco de comparacao</span>
            <input
              name="compareAt"
              type="number"
              step="0.01"
              min="0"
              value={compareAt}
              onChange={(event) => setCompareAt(event.target.value)}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Estoque</span>
            <input
              name="stock"
              type="number"
              min="0"
              value={variants.length > 0 ? String(variantsStock) : stock}
              onChange={(event) => setStock(event.target.value)}
              readOnly={variants.length > 0}
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none read-only:cursor-not-allowed read-only:bg-sand/70"
            />
            <p className="text-xs text-espresso/60">
              {variants.length > 0
                ? "Calculado automaticamente pela soma das variacoes."
                : "Use este campo para produtos sem variacoes."}
            </p>
          </label>

          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span>Categoria</span>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <aside className="rounded-[1.75rem] border border-espresso/10 bg-sand/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                Midia
              </p>
              <h3 className="mt-2 font-display text-2xl">Imagem principal</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-espresso/70">
              {currency(Number(price || 0))}
            </span>
          </div>

          <img
            src={`${(imageUrl || fallbackImage).trim()}${imageUrl ? "" : "?auto=format&fit=crop&w=600&q=80"}`}
            alt={name || "Preview do produto"}
            className="mt-4 h-72 w-full rounded-[1.5rem] border border-espresso/10 object-cover"
          />

          <div className="mt-4 space-y-3">
            <label className="space-y-2 text-sm">
              <span>URL da imagem</span>
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="w-full rounded-2xl border border-espresso/15 bg-white px-4 py-3 outline-none"
                placeholder="https://..."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
              >
                {mainImageUploading ? "Enviando..." : "Upload da imagem"}
              </button>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleMainImageSelected(event.target.files?.[0])}
              />
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700"
                >
                  Remover imagem
                </button>
              ) : null}
            </div>

            {mainImageError ? (
              <p className="text-sm text-red-700">{mainImageError}</p>
            ) : null}

            <div className="rounded-[1.25rem] border border-espresso/10 bg-white p-4 text-sm text-espresso/70">
              <p>
                Estoque total <strong>{effectiveStock}</strong>
              </p>
              <p className="mt-1">
                Variacoes cadastradas <strong>{variants.length}</strong>
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-[1.75rem] border border-espresso/10 bg-sand/35 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
              Galeria rapida
            </p>
            <h3 className="mt-2 font-display text-2xl">Miniaturas e preview</h3>
          </div>
          <span className="text-sm text-espresso/65">
            Use a imagem principal e as imagens das variacoes para enriquecer a vitrine.
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {galleryImages.length > 0 ? (
            galleryImages.map((galleryImage, index) => (
              <img
                key={`${galleryImage}-${index}`}
                src={galleryImage}
                alt={`Imagem ${index + 1}`}
                className="h-24 w-20 rounded-[1rem] border border-espresso/10 object-cover"
              />
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-espresso/15 bg-white px-4 py-6 text-sm text-espresso/60">
              As miniaturas aparecerao aqui conforme voce enviar a imagem principal e as
              fotos das variacoes.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-espresso/10 bg-sand/35 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
              Variacoes
            </p>
            <h3 className="mt-2 font-display text-2xl">Editor visual da grade</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addVariant}
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Adicionar variacao
            </button>
            <button
              type="button"
              onClick={addSizeTemplate}
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Grade P, M, G e GG
            </button>
            <button
              type="button"
              onClick={addNumericSizeTemplate}
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Grade 36 a 44
            </button>
            <button
              type="button"
              onClick={normalizeVariantData}
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Padronizar SKUs e labels
            </button>
            <button
              type="button"
              onClick={copyMainImageToVariants}
              className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
            >
              Copiar imagem principal
            </button>
          </div>
        </div>

        {variants.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {variants.map((variant, index) => (
              <article
                key={variant.id}
                className="rounded-[1.5rem] border border-espresso/10 bg-white p-4"
              >
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <img
                      src={variant.imageUrl || imageUrl || fallbackImage}
                      alt={variant.optionLabel || `Variacao ${index + 1}`}
                      className="h-28 w-24 rounded-[1rem] border border-espresso/10 object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <label className="rounded-full border border-espresso/15 px-4 py-2 text-center text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            handleVariantImageSelected(variant.id, event.target.files?.[0])
                          }
                        />
                        {variantUploadState[variant.id] ? "Enviando..." : "Upload"}
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                    {variantUploadError[variant.id] ? (
                      <p className="text-xs text-red-700">{variantUploadError[variant.id]}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2 text-sm">
                      <span>SKU</span>
                      <input
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(variant.id, "sku", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="CAMI-PRETA-M"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>Cor</span>
                      <input
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(variant.id, "color", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="Preto"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>Tamanho</span>
                      <input
                        value={variant.size}
                        onChange={(event) =>
                          updateVariant(variant.id, "size", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="M"
                      />
                    </label>
                    <label className="space-y-2 text-sm md:col-span-2 xl:col-span-3">
                      <span>Label da variacao</span>
                      <input
                        value={variant.optionLabel}
                        onChange={(event) =>
                          updateVariant(variant.id, "optionLabel", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="Preto / M"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>Preco da variacao</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.priceOverride}
                        onChange={(event) =>
                          updateVariant(variant.id, "priceOverride", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="Opcional"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>De por</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.compareAtOverride}
                        onChange={(event) =>
                          updateVariant(variant.id, "compareAtOverride", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="Opcional"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span>Estoque</span>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(variant.id, "stock", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm md:col-span-2 xl:col-span-3">
                      <span>URL da imagem da variacao</span>
                      <input
                        value={variant.imageUrl}
                        onChange={(event) =>
                          updateVariant(variant.id, "imageUrl", event.target.value)
                        }
                        className="w-full rounded-2xl border border-espresso/15 bg-sand px-4 py-3 outline-none"
                        placeholder="https://..."
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm text-espresso/75 md:col-span-2 xl:col-span-3">
                      <input
                        type="radio"
                        checked={variant.isDefault}
                        onChange={() => setDefaultVariant(variant.id)}
                        className="h-4 w-4"
                      />
                      Definir como variacao padrao
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-espresso/15 bg-white px-5 py-8 text-sm text-espresso/65">
            Sem variacoes por enquanto. Use a grade para cadastrar cor, tamanho, SKU,
            imagem e estoque por variante.
          </div>
        )}
      </section>
    </div>
  );
}
