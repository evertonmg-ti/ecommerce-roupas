"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CartProductInput } from "@/lib/cart";
import { subscribeBackInStock } from "@/lib/public-engagement";

type ProductPurchaseActionsProps = {
  product: CartProductInput & {
    variants?: Array<{
      id: string;
      sku: string;
      color?: string;
      size?: string;
      optionLabel: string;
      price?: number;
      compareAt?: number;
      stock: number;
      imageUrl?: string;
      isDefault?: boolean;
    }>;
  };
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
};

export function ProductPurchaseActions({
  product,
  selectedVariantId: controlledVariantId,
  onVariantChange
}: ProductPurchaseActionsProps) {
  const { addItem } = useCart();
  const initialVariant =
    product.variants?.find((variant) => variant.isDefault) ?? product.variants?.[0];
  const [uncontrolledVariantId, setUncontrolledVariantId] = useState(initialVariant?.id ?? "");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyState, setNotifyState] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const selectedVariantId = controlledVariantId ?? uncontrolledVariantId;
  const selectedVariant = product.variants?.find(
    (variant) => variant.id === selectedVariantId
  );
  const effectiveStock = selectedVariant?.stock ?? product.stock;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const isUnavailable = effectiveStock < 1;
  const maxQuantity = Math.max(effectiveStock, 1);

  function handleVariantChange(variantId: string) {
    if (onVariantChange) {
      onVariantChange(variantId);
    } else {
      setUncontrolledVariantId(variantId);
    }

    setQuantity(1);
  }

  function handleAdd() {
    if (isUnavailable) {
      return;
    }

    addItem(
      {
        ...product,
        id: selectedVariant?.id ?? product.id,
        productId: product.id,
        variantId: selectedVariant?.id,
        sku: selectedVariant?.sku,
        variantLabel: selectedVariant?.optionLabel,
        price: selectedVariant?.price ?? product.price,
        imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
        stock: selectedVariant?.stock ?? product.stock
      },
      quantity
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function handleQuantityChange(value: number) {
    if (!Number.isFinite(value)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.max(1, Math.min(Math.trunc(value), maxQuantity)));
  }

  async function handleNotifyMe() {
    const email = notifyEmail.trim().toLowerCase();

    if (!email) {
      setNotifyState({
        type: "error",
        message: "Informe um email para receber o aviso."
      });
      return;
    }

    try {
      await subscribeBackInStock(product.id, email);
      setNotifyState({
        type: "success",
        message: "Avisaremos por email quando este produto voltar ao estoque."
      });
    } catch (error) {
      setNotifyState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o aviso de estoque."
      });
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {isUnavailable ? (
        <div className="space-y-4 rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
          <p>Produto indisponivel no momento. Deixe seu email para receber o aviso.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.value)}
              placeholder="seu@email.com"
              className="flex-1 rounded-full border border-terracotta/25 bg-white/70 px-4 py-3 text-espresso outline-none"
            />
            <button
              type="button"
              onClick={handleNotifyMe}
              className="rounded-full bg-espresso px-6 py-3 text-sand"
            >
              Avise-me
            </button>
          </div>
          {notifyState.type !== "idle" ? (
            <p className={notifyState.type === "success" ? "text-moss" : "text-terracotta"}>
              {notifyState.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {!isUnavailable ? (
        <div className="space-y-4">
          {product.variants?.length ? (
            <label className="block max-w-md space-y-2 text-sm text-espresso/70">
              <span>Variacao</span>
              <select
                value={selectedVariantId}
                onChange={(event) => handleVariantChange(event.target.value)}
                className="w-full rounded-[1.5rem] border border-espresso/10 bg-sand/40 px-4 py-3"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.optionLabel} - {variant.sku} - estoque {variant.stock}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex max-w-xs items-center justify-between gap-4 rounded-[1.5rem] border border-espresso/10 bg-sand/40 px-4 py-3 text-sm text-espresso/70">
            Quantidade
            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) => handleQuantityChange(Number(event.target.value))}
              className="w-24 rounded-full border border-espresso/15 bg-white/70 px-4 py-2 text-center outline-none"
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          onClick={handleAdd}
          disabled={isUnavailable}
          className="rounded-full bg-espresso px-6 py-3 text-sand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
        </button>
        <Link
          href={isUnavailable ? "#" : "/checkout"}
          onClick={(event) => {
            if (isUnavailable) {
              event.preventDefault();
              return;
            }

            addItem(
              {
                ...product,
                id: selectedVariant?.id ?? product.id,
                productId: product.id,
                variantId: selectedVariant?.id,
                sku: selectedVariant?.sku,
                variantLabel: selectedVariant?.optionLabel,
                price: selectedVariant?.price ?? product.price,
                imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
                stock: selectedVariant?.stock ?? product.stock
              },
              quantity
            );
          }}
          className="rounded-full border border-espresso/15 px-6 py-3 text-center aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={isUnavailable}
        >
          Comprar agora
        </Link>
      </div>

      {selectedVariant ? (
        <p className="text-sm text-espresso/65">
          SKU {selectedVariant.sku} selecionado - preco {effectivePrice.toFixed(2).replace(".", ",")}
        </p>
      ) : null}

      {!isUnavailable && quantity === maxQuantity ? (
        <p className="text-sm text-terracotta">
          Voce selecionou o limite disponivel em estoque.
        </p>
      ) : null}
    </div>
  );
}
