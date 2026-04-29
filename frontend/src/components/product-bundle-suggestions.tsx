"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Product } from "@/lib/data";
import { currency } from "@/lib/utils";

type ProductBundleSuggestionsProps = {
  mainProduct: Product;
  relatedProducts: Product[];
};

export function ProductBundleSuggestions({
  mainProduct,
  relatedProducts
}: ProductBundleSuggestionsProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const bundleProducts = relatedProducts.slice(0, 2);

  if (bundleProducts.length === 0) {
    return null;
  }

  const bundleTotal = [mainProduct, ...bundleProducts].reduce(
    (sum, product) => sum + product.price,
    0
  );

  function handleAddBundle() {
    addItem(
      {
        id: mainProduct.id,
        name: mainProduct.name,
        slug: mainProduct.slug,
        price: mainProduct.price,
        imageUrl: mainProduct.imageUrl,
        category: mainProduct.category,
        stock: mainProduct.stock
      },
      1
    );

    bundleProducts.forEach((product) => {
      addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock
        },
        1
      );
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <section className="mt-14 rounded-[2rem] border border-espresso/10 bg-white/80 p-8 shadow-soft">
      <p className="text-xs uppercase tracking-[0.3em] text-terracotta">Compre junto</p>
      <h2 className="mt-3 font-display text-4xl">Monte o look completo</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[mainProduct, ...bundleProducts].map((product) => (
          <div
            key={product.id}
            className="rounded-[1.5rem] border border-espresso/10 bg-sand/35 p-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-terracotta">
              {product.category}
            </p>
            <p className="mt-2 font-medium">{product.name}</p>
            <p className="mt-2 text-sm text-espresso/60">{currency(product.price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-espresso/70">
          Total do conjunto: <strong>{currency(bundleTotal)}</strong>
        </p>
        <button
          type="button"
          onClick={handleAddBundle}
          className="rounded-full bg-espresso px-6 py-3 text-sand"
        >
          {added ? "Kit adicionado" : "Adicionar conjunto ao carrinho"}
        </button>
      </div>
    </section>
  );
}
