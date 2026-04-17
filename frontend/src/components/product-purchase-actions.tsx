"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CartProductInput } from "@/lib/cart";

type ProductPurchaseActionsProps = {
  product: CartProductInput;
};

export function ProductPurchaseActions({
  product
}: ProductPurchaseActionsProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        onClick={handleAdd}
        className="rounded-full bg-espresso px-6 py-3 text-sand"
      >
        {added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
      </button>
      <Link
        href="/checkout"
        onClick={() => addItem(product, 1)}
        className="rounded-full border border-espresso/15 px-6 py-3 text-center"
      >
        Comprar agora
      </Link>
    </div>
  );
}
