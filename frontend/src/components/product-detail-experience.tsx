"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { Product } from "@/lib/data";
import { currency } from "@/lib/utils";

type ProductDetailExperienceProps = {
  product: Product;
  fallbackImageUrl?: string;
};

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  variantId?: string;
};

export function ProductDetailExperience({
  product,
  fallbackImageUrl
}: ProductDetailExperienceProps) {
  const initialVariant =
    product.variants?.find((variant) => variant.isDefault) ?? product.variants?.[0];
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id ?? "");
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const selectedVariant = product.variants?.find((variant) => variant.id === selectedVariantId);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    const nextImages: GalleryImage[] = [];
    const primaryImage = product.imageUrl ?? fallbackImageUrl;

    if (primaryImage) {
      nextImages.push({
        id: "base",
        src: primaryImage,
        alt: product.name
      });
    }

    for (const variant of product.variants ?? []) {
      if (!variant.imageUrl) {
        continue;
      }

      nextImages.push({
        id: variant.id,
        src: variant.imageUrl,
        alt: `${product.name} - ${variant.optionLabel}`,
        variantId: variant.id
      });
    }

    return nextImages;
  }, [fallbackImageUrl, product.imageUrl, product.name, product.variants]);

  useEffect(() => {
    if (selectedVariant?.imageUrl) {
      const variantImage = galleryImages.find((image) => image.variantId === selectedVariant.id);
      setSelectedGalleryId(variantImage?.id ?? null);
      return;
    }

    setSelectedGalleryId((current) => {
      if (current && galleryImages.some((image) => image.id === current)) {
        return current;
      }

      return galleryImages[0]?.id ?? null;
    });
  }, [galleryImages, selectedVariant]);

  const activeImage =
    galleryImages.find((image) => image.id === selectedGalleryId) ?? galleryImages[0];
  const primaryImageSrc =
    activeImage?.src ??
    fallbackImageUrl ??
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveCompareAt = selectedVariant?.compareAt ?? product.compareAt;
  const effectiveStock = selectedVariant?.stock ?? product.stock;

  return (
    <section className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-espresso/10 bg-white/70 shadow-soft">
          <Image
            src={`${primaryImageSrc}?auto=format&fit=crop&w=1200&q=80`}
            alt={activeImage?.alt ?? product.name}
            fill
            className="object-cover"
          />
        </div>
        {galleryImages.length > 1 ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {galleryImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedGalleryId(image.id)}
                className={`relative aspect-square overflow-hidden rounded-[1.25rem] border bg-white/70 ${
                  image.id === activeImage?.id
                    ? "border-terracotta shadow-soft"
                    : "border-espresso/10"
                }`}
              >
                <Image
                  src={`${image.src}?auto=format&fit=crop&w=320&q=80`}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">
          {product.category}
        </p>
        <h1 className="mt-4 font-display text-5xl">{product.name}</h1>
        <p className="mt-5 text-lg leading-8 text-espresso/70">{product.description}</p>
        <div className="mt-8 flex items-end gap-4">
          <p className="font-display text-4xl">{currency(effectivePrice)}</p>
          {effectiveCompareAt ? (
            <p className="pb-1 text-lg text-espresso/45 line-through">
              {currency(effectiveCompareAt)}
            </p>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-moss">
          Estoque disponivel: {effectiveStock} unidade{effectiveStock === 1 ? "" : "s"}
        </p>
        {selectedVariant ? (
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-espresso/70">
            {selectedVariant.color ? (
              <span className="rounded-full border border-espresso/10 bg-sand/40 px-3 py-1">
                Cor: {selectedVariant.color}
              </span>
            ) : null}
            {selectedVariant.size ? (
              <span className="rounded-full border border-espresso/10 bg-sand/40 px-3 py-1">
                Tamanho: {selectedVariant.size}
              </span>
            ) : null}
            <span className="rounded-full border border-espresso/10 bg-sand/40 px-3 py-1">
              SKU: {selectedVariant.sku}
            </span>
          </div>
        ) : null}
        <ProductPurchaseActions
          product={{
            id: product.id,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            stock: product.stock,
            variants: product.variants
          }}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />
      </div>
    </section>
  );
}
