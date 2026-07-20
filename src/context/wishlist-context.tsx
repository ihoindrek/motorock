"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductType } from "@/types/catalog-product";

export type WishlistItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  type?: ProductType;
  productId?: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  hydrated: boolean;
  has: (slug: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "motorock-wishlist";

function readStoredItems(): WishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as WishlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const has = useCallback(
    (slug: string) => items.some((item) => item.slug === slug),
    [items],
  );

  const toggle = useCallback((item: WishlistItem) => {
    setItems((current) => {
      if (current.some((entry) => entry.slug === item.slug)) {
        return current.filter((entry) => entry.slug !== item.slug);
      }

      return [
        {
          slug: item.slug,
          name: item.name,
          price: item.price,
          image: item.image,
          brand: item.brand,
          type: item.type,
          productId: item.productId,
        },
        ...current,
      ];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      hydrated,
      has,
      toggle,
      remove,
      clear,
    }),
    [items, hydrated, has, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
