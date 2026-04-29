"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";

type ReorderOrderButtonProps = {
  items: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
  }>;
};

export function ReorderOrderButton({ items }: ReorderOrderButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleReorder() {
    items.forEach((item) => {
      addItem(
        {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.unitPrice,
          imageUrl: item.imageUrl,
          category: item.category,
          stock: 999
        },
        item.quantity
      );
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
    >
      {added ? "Itens adicionados" : "Comprar novamente"}
    </button>
  );
}
