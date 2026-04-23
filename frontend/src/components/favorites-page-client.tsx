"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { currency } from "@/lib/utils";

export function FavoritesPageClient() {
  const { addItem } = useCart();
  const { clearWishlist, items, removeFavorite } = useWishlist();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Favoritos</p>
          <h1 className="mt-4 font-display text-4xl">Sua lista esta vazia</h1>
          <p className="mt-4 max-w-xl text-espresso/70">
            Salve produtos para comparar depois e comprar com mais rapidez.
          </p>
          <Link
            href="/produtos"
            className="mt-8 inline-flex rounded-full bg-espresso px-6 py-3 text-sand"
          >
            Explorar produtos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Favoritos</p>
          <h1 className="mt-3 font-display text-5xl">Produtos salvos</h1>
          <p className="mt-4 max-w-2xl text-espresso/70">
            Sua selecao fica salva neste navegador para facilitar proximas compras.
          </p>
        </div>
        <button
          onClick={clearWishlist}
          className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
        >
          Limpar lista
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-[2rem] border border-espresso/10 bg-white/80 shadow-soft"
          >
            <div className="relative h-64">
              <Image
                src={`${item.imageUrl ?? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"}?auto=format&fit=crop&w=900&q=80`}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                  {item.category}
                </p>
                <h2 className="mt-2 font-display text-3xl">{item.name}</h2>
                <p className="mt-2 font-medium">{currency(item.price)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/produtos/${item.slug}`}
                  className="rounded-full bg-espresso px-4 py-2 text-sm text-sand"
                >
                  Ver produto
                </Link>
                <button
                  onClick={() => addItem(item, 1)}
                  disabled={item.stock < 1}
                  className="inline-flex items-center gap-2 rounded-full border border-espresso/15 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Comprar
                </button>
                <button
                  onClick={() => removeFavorite(item.id)}
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
    </section>
  );
}
