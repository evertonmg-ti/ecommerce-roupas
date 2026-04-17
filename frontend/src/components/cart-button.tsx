"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrinho"
      className="relative rounded-full bg-espresso p-2 text-sand"
      aria-label="Abrir carrinho"
    >
      <ShoppingBag className="h-5 w-5" />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-semibold text-white">
          {totalItems}
        </span>
      ) : null}
    </Link>
  );
}
