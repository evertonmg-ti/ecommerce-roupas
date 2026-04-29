"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";

export function FavoritesButton() {
  const { isSyncing, totalItems } = useWishlist();

  return (
    <Link
      href="/favoritos"
      className="relative rounded-full border border-espresso/15 p-2 hover:border-terracotta"
      aria-label="Favoritos"
      title={isSyncing ? "Sincronizando favoritos..." : "Favoritos"}
    >
      <Heart className="h-5 w-5" />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-xs text-sand">
          {totalItems}
        </span>
      ) : null}
    </Link>
  );
}
