"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

type ReorderOrderButtonProps = {
  items: Array<{
    id: string;
    productId?: string;
    variantId?: string;
    sku?: string;
    variantLabel?: string;
    name: string;
    slug: string;
    category: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
  }>;
  redirectToCheckout?: boolean;
  label?: string;
};

export function ReorderOrderButton({
  items,
  redirectToCheckout = false,
  label
}: ReorderOrderButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleReorder() {
    items.forEach((item) => {
      addItem(
        {
          id: item.id,
          productId: item.productId ?? item.id,
          variantId: item.variantId,
          sku: item.sku,
          variantLabel: item.variantLabel,
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

    if (redirectToCheckout) {
      router.push("/checkout");
      return;
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className="rounded-full border border-espresso/15 px-5 py-3 text-sm"
    >
      {added ? "Itens adicionados" : label ?? "Comprar novamente"}
    </button>
  );
}
