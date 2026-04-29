"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { CartItem, CartProductInput, clampCartQuantity, getCartTotals } from "@/lib/cart";

const CART_STORAGE_KEY = "maison-aurea-cart";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: CartProductInput, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as CartItem[];
      setItems(parsed);
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const totals = getCartTotals(items);

    return {
      items,
      totalItems: totals.items,
      totalPrice: totals.total,
      addItem(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);

          if (!existing) {
            const nextQuantity = clampCartQuantity(quantity, product.stock);

            if (nextQuantity <= 0) {
              return current;
            }

            return [
              ...current,
              {
                ...product,
                quantity: nextQuantity
              }
            ];
          }

          return current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: clampCartQuantity(item.quantity + quantity, item.stock)
                }
              : item
          );
        });
      },
      updateQuantity(productId, quantity) {
        setItems((current) =>
          current
            .map((item) =>
              item.id === productId
                ? {
                    ...item,
                    quantity: clampCartQuantity(quantity, item.stock)
                  }
                : item
            )
            .filter((item) => item.quantity > 0)
        );
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.id !== productId));
      },
      replaceItems(nextItems) {
        setItems(nextItems);
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
