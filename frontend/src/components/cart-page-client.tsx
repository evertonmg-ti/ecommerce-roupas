"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { getCartSnapshotKey } from "@/lib/cart";
import {
  CartAvailabilityIssue,
  reconcileCartWithAvailability,
  validateCartAvailability
} from "@/lib/public-cart";
import { currency } from "@/lib/utils";

export function CartPageClient() {
  const {
    items,
    removeItem,
    replaceItems,
    totalPrice,
    totalItems,
    updateQuantity
  } = useCart();
  const [availabilityIssues, setAvailabilityIssues] = useState<CartAvailabilityIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const snapshotKey = getCartSnapshotKey(items);

  useEffect(() => {
    if (items.length === 0) {
      setAvailabilityIssues([]);
      return;
    }

    let active = true;
    setIsValidating(true);

    validateCartAvailability(items)
      .then((availability) => {
        if (!active) {
          return;
        }

        const reconciled = reconcileCartWithAvailability(items, availability);
        setAvailabilityIssues(reconciled.issues);

        if (getCartSnapshotKey(reconciled.items) !== snapshotKey) {
          replaceItems(reconciled.items);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setAvailabilityIssues([
          {
            type: "removed",
            productId: "sync-error",
            name: "Carrinho",
            message:
              error instanceof Error
                ? error.message
                : "Nao foi possivel validar o estoque agora."
          }
        ]);
      })
      .finally(() => {
        if (active) {
          setIsValidating(false);
        }
      });

    return () => {
      active = false;
    };
  }, [items, replaceItems, snapshotKey]);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Carrinho</p>
          <h1 className="mt-4 font-display text-4xl">Seu carrinho esta vazio</h1>
          <p className="mt-4 max-w-xl text-espresso/70">
            Explore a colecao e adicione produtos para seguir ao checkout.
          </p>
          <Link
            href="/produtos"
            className="mt-8 inline-flex rounded-full bg-espresso px-6 py-3 text-sand"
          >
            Ver produtos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Carrinho</p>
          <h1 className="mt-3 font-display text-5xl">Itens selecionados</h1>
        </div>
        {availabilityIssues.length > 0 ? (
          <div className="rounded-[1.5rem] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
            {availabilityIssues.map((issue) => (
              <p key={`${issue.productId}-${issue.type}`}>{issue.message}</p>
            ))}
          </div>
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-[2rem] border border-espresso/10 bg-white/80 p-4 shadow-soft sm:grid-cols-[160px_1fr]"
          >
            <div className="relative min-h-40 overflow-hidden rounded-[1.5rem] bg-sand/70">
              <Image
                src={`${item.imageUrl ?? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"}?auto=format&fit=crop&w=800&q=80`}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                    {item.category}
                  </p>
                  <h2 className="mt-2 font-display text-3xl">{item.name}</h2>
                  <p className="mt-2 text-sm text-espresso/60">
                    Estoque disponivel: {item.stock}
                  </p>
                  {item.quantity >= item.stock ? (
                    <p className="mt-2 text-sm text-terracotta">
                      Quantidade no limite do estoque.
                    </p>
                  ) : null}
                </div>
                <p className="font-display text-3xl">{currency(item.price)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm text-espresso/70">
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.id, Number(event.target.value))
                    }
                    className="w-20 rounded-full border border-espresso/15 bg-transparent px-4 py-2"
                  />
                </label>
                <p className="text-sm font-medium text-espresso">
                  Total: {currency(item.price * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-espresso/15 px-4 py-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Resumo</p>
        <div className="mt-6 space-y-4 text-sm text-espresso/70">
          <div className="flex items-center justify-between">
            <span>Itens</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{currency(totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frete estimado</span>
            <span>Calculado no checkout</span>
          </div>
        </div>
        <div className="mt-6 border-t border-espresso/10 pt-6">
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-espresso/70">Total estimado</span>
            <span className="font-display text-4xl">{currency(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-espresso px-6 py-3 text-sand"
          >
            {isValidating ? "Validando estoque..." : "Ir para checkout"}
          </Link>
        </div>
      </aside>
    </section>
  );
}
