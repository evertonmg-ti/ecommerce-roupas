"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { CartItem, CartProductInput, clampCartQuantity, getCartSnapshotKey, getCartTotals } from "@/lib/cart";

const CART_STORAGE_KEY = "maison-aurea-cart";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isSyncing: boolean;
  addItem: (product: CartProductInput, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
};

type SavedCartResponse = {
  items: CartItem[];
  updatedAt?: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function mergeCartItems(localItems: CartItem[], remoteItems: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of remoteItems) {
    merged.set(item.id, item);
  }

  for (const item of localItems) {
    const existing = merged.get(item.id);

    if (!existing) {
      merged.set(item.id, item);
      continue;
    }

    merged.set(item.id, {
      ...existing,
      price: item.price,
      imageUrl: item.imageUrl ?? existing.imageUrl,
      stock: Math.max(existing.stock, item.stock),
      quantity: clampCartQuantity(existing.quantity + item.quantity, Math.max(existing.stock, item.stock))
    });
  }

  return Array.from(merged.values());
}

async function loadSavedCart() {
  const response = await fetch("/api/customer/cart", {
    cache: "no-store"
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o carrinho salvo.");
  }

  return (await response.json()) as SavedCartResponse;
}

async function saveCart(items: CartItem[]) {
  const response = await fetch("/api/customer/cart", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }))
    })
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel sincronizar o carrinho.");
  }

  return (await response.json()) as SavedCartResponse;
}

async function clearSavedCart() {
  const response = await fetch("/api/customer/cart", {
    method: "DELETE"
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel limpar o carrinho salvo.");
  }

  return true;
}

export function CartProvider({
  children,
  isCustomerAuthenticated
}: {
  children: React.ReactNode;
  isCustomerAuthenticated: boolean;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const customerSyncEnabledRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isCustomerAuthenticated) {
      customerSyncEnabledRef.current = false;
      lastSyncedSnapshotRef.current = null;
      return;
    }

    let active = true;
    setIsSyncing(true);

    loadSavedCart()
      .then((savedCart) => {
        if (!active || !savedCart) {
          return;
        }

        const mergedItems = mergeCartItems(items, savedCart.items);
        setItems(mergedItems);
        lastSyncedSnapshotRef.current = getCartSnapshotKey(mergedItems);
        customerSyncEnabledRef.current = true;

        if (getCartSnapshotKey(mergedItems) !== getCartSnapshotKey(savedCart.items)) {
          return saveCart(mergedItems);
        }

        return savedCart;
      })
      .then((savedCart) => {
        if (!active || !savedCart) {
          return;
        }

        lastSyncedSnapshotRef.current = getCartSnapshotKey(
          Array.isArray(savedCart.items) ? savedCart.items : items
        );
      })
      .catch(() => {
        if (active) {
          customerSyncEnabledRef.current = true;
        }
      })
      .finally(() => {
        if (active) {
          setIsSyncing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isCustomerAuthenticated, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !isCustomerAuthenticated || !customerSyncEnabledRef.current) {
      return;
    }

    const snapshotKey = getCartSnapshotKey(items);

    if (snapshotKey === lastSyncedSnapshotRef.current) {
      return;
    }

    let active = true;
    setIsSyncing(true);
    const timeoutId = window.setTimeout(() => {
      const request = items.length === 0 ? clearSavedCart() : saveCart(items);

      request
        .then(() => {
          if (active) {
            lastSyncedSnapshotRef.current = snapshotKey;
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) {
            setIsSyncing(false);
          }
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [isCustomerAuthenticated, isHydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const totals = getCartTotals(items);

    return {
      items,
      totalItems: totals.items,
      totalPrice: totals.total,
      isSyncing,
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
  }, [isSyncing, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
