"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { WishlistProductInput } from "@/lib/wishlist";

const WISHLIST_STORAGE_KEY = "maison-aurea-wishlist";

type WishlistContextValue = {
  items: WishlistProductInput[];
  totalItems: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: WishlistProductInput) => void;
  removeFavorite: (productId: string) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistProductInput[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      setItems(JSON.parse(stored) as WishlistProductInput[]);
    } catch {
      window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      totalItems: items.length,
      isFavorite(productId) {
        return items.some((item) => item.id === productId);
      },
      toggleFavorite(product) {
        setItems((current) =>
          current.some((item) => item.id === product.id)
            ? current.filter((item) => item.id !== product.id)
            : [product, ...current]
        );
      },
      removeFavorite(productId) {
        setItems((current) => current.filter((item) => item.id !== productId));
      },
      clearWishlist() {
        setItems([]);
      }
    }),
    [items]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider.");
  }

  return context;
}
