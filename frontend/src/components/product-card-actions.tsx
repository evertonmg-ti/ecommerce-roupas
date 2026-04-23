"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { CartProductInput } from "@/lib/cart";
import { WishlistProductInput } from "@/lib/wishlist";

type ProductCardActionsProps = {
  product: CartProductInput & WishlistProductInput;
};

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const favorite = isFavorite(product.id);
  const unavailable = product.stock < 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/produtos/${product.slug}`}
        className="inline-flex rounded-full bg-espresso px-4 py-2 text-sm text-sand"
      >
        Ver produto
      </Link>
      <button
        type="button"
        onClick={() => addItem(product, 1)}
        disabled={unavailable}
        className="inline-flex items-center gap-2 rounded-full border border-espresso/15 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingBag className="h-4 w-4" />
        Comprar
      </button>
      <button
        type="button"
        onClick={() => toggleFavorite(product)}
        className="inline-flex items-center gap-2 rounded-full border border-espresso/15 px-4 py-2 text-sm"
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-terracotta text-terracotta" : ""}`} />
        {favorite ? "Salvo" : "Favoritar"}
      </button>
    </div>
  );
}
