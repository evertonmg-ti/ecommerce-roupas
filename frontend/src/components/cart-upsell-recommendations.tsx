"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CatalogRecommendation, getCartUpsellRecommendations } from "@/lib/public-catalog-client";
import { currency } from "@/lib/utils";

export function CartUpsellRecommendations() {
  const { items, addItem } = useCart();
  const [recommendations, setRecommendations] = useState<CatalogRecommendation[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setRecommendations([]);
      return;
    }

    let active = true;

    getCartUpsellRecommendations(items)
      .then((nextItems) => {
        if (active) {
          setRecommendations(nextItems);
        }
      })
      .catch(() => {
        if (active) {
          setRecommendations([]);
        }
      });

    return () => {
      active = false;
    };
  }, [items]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-espresso/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Upsell</p>
        <h2 className="mt-3 font-display text-4xl">Leve junto e aumente o pedido</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {recommendations.map((product) => (
            <article
              key={product.id}
              className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
                {product.category}
              </p>
              <p className="mt-2 font-medium">{product.name}</p>
              <p className="mt-2 text-sm text-espresso/60 line-clamp-2">
                {product.description}
              </p>
              <p className="mt-3 font-medium">{currency(product.price)}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    addItem(
                      {
                        id: product.id,
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        category: product.category,
                        stock: product.stock
                      },
                      1
                    )
                  }
                  className="rounded-full bg-espresso px-4 py-2 text-sm text-sand"
                >
                  Adicionar
                </button>
                <Link
                  href={`/produtos/${product.slug}`}
                  className="rounded-full border border-espresso/15 px-4 py-2 text-sm"
                >
                  Ver
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
