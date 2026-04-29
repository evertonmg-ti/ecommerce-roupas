"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { WishlistProductInput } from "@/lib/wishlist";

const WISHLIST_STORAGE_KEY = "maison-aurea-wishlist";

type WishlistContextValue = {
  items: WishlistProductInput[];
  totalItems: number;
  isSyncing: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: WishlistProductInput) => void;
  removeFavorite: (productId: string) => void;
  clearWishlist: () => void;
};

type SavedWishlistResponse = {
  items: WishlistProductInput[];
  updatedAt?: string | null;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function mergeWishlistItems(
  localItems: WishlistProductInput[],
  remoteItems: WishlistProductInput[]
) {
  const merged = new Map<string, WishlistProductInput>();

  for (const item of remoteItems) {
    merged.set(item.id, item);
  }

  for (const item of localItems) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  }

  return Array.from(merged.values());
}

function getWishlistSnapshot(items: WishlistProductInput[]) {
  return items
    .map((item) => item.id)
    .sort()
    .join("|");
}

async function loadSavedWishlist() {
  const response = await fetch("/api/customer/wishlist", {
    cache: "no-store"
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os favoritos salvos.");
  }

  return (await response.json()) as SavedWishlistResponse;
}

async function saveWishlist(items: WishlistProductInput[]) {
  const response = await fetch("/api/customer/wishlist", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.id
      }))
    })
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel sincronizar os favoritos.");
  }

  return (await response.json()) as SavedWishlistResponse;
}

async function clearSavedWishlist() {
  const response = await fetch("/api/customer/wishlist", {
    method: "DELETE"
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel limpar os favoritos salvos.");
  }

  return true;
}

export function WishlistProvider({
  children,
  isCustomerAuthenticated
}: {
  children: React.ReactNode;
  isCustomerAuthenticated: boolean;
}) {
  const [items, setItems] = useState<WishlistProductInput[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncedSnapshotRef = useRef<string | null>(null);
  const customerSyncEnabledRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);

    if (stored) {
      try {
        setItems(JSON.parse(stored) as WishlistProductInput[]);
      } catch {
        window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
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

    loadSavedWishlist()
      .then((savedWishlist) => {
        if (!active || !savedWishlist) {
          return;
        }

        const mergedItems = mergeWishlistItems(items, savedWishlist.items);
        setItems(mergedItems);
        lastSyncedSnapshotRef.current = getWishlistSnapshot(mergedItems);
        customerSyncEnabledRef.current = true;

        if (getWishlistSnapshot(mergedItems) !== getWishlistSnapshot(savedWishlist.items)) {
          return saveWishlist(mergedItems);
        }

        return savedWishlist;
      })
      .then((savedWishlist) => {
        if (!active || !savedWishlist) {
          return;
        }

        lastSyncedSnapshotRef.current = getWishlistSnapshot(savedWishlist.items);
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

    const snapshot = getWishlistSnapshot(items);

    if (snapshot === lastSyncedSnapshotRef.current) {
      return;
    }

    let active = true;
    setIsSyncing(true);
    const timeoutId = window.setTimeout(() => {
      const request = items.length === 0 ? clearSavedWishlist() : saveWishlist(items);

      request
        .then(() => {
          if (active) {
            lastSyncedSnapshotRef.current = snapshot;
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

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      totalItems: items.length,
      isSyncing,
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
    [isSyncing, items]
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
