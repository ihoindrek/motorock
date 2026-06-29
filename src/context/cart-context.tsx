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
import { formatSizeLabel } from "@/lib/shop/size-label";

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  type?: ProductType;
  quantity: number;
  size?: string;
  color?: string;
  productId?: number;
  variationId?: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  drawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  removeItem: (slug: string, size?: string) => void;
  updateQuantity: (slug: string, quantity: number, size?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "motorock-cart";

function lineKey(slug: string, size?: string) {
  return `${slug}:${size ?? ""}`;
}

function readStoredLines(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openCart = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setDrawerOpen((open) => !open);
  }, []);

  useEffect(() => {
    setLines(readStoredLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const normalizedSize =
        line.size && line.size !== "One size"
          ? formatSizeLabel(line.size)
          : line.size;

      setLines((current) => {
        const key = lineKey(line.slug, normalizedSize);
        const existing = current.find(
          (item) => lineKey(item.slug, item.size) === key,
        );

        if (existing) {
          return current.map((item) =>
            lineKey(item.slug, item.size) === key
              ? { ...item, quantity: item.quantity + (line.quantity ?? 1) }
              : item,
          );
        }

        return [
          ...current,
          {
            slug: line.slug,
            name: line.name,
            price: line.price,
            image: line.image,
            brand: line.brand,
            type: line.type,
            size: normalizedSize,
            color: line.color,
            productId: line.productId,
            variationId: line.variationId,
            quantity: line.quantity ?? 1,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((slug: string, size?: string) => {
    const key = lineKey(slug, size);
    setLines((current) =>
      current.filter((item) => lineKey(item.slug, item.size) !== key),
    );
  }, []);

  const updateQuantity = useCallback(
    (slug: string, quantity: number, size?: string) => {
      const key = lineKey(slug, size);

      if (quantity <= 0) {
        setLines((current) =>
          current.filter((item) => lineKey(item.slug, item.size) !== key),
        );
        return;
      }

      setLines((current) =>
        current.map((item) =>
          lineKey(item.slug, item.size) === key ? { ...item, quantity } : item,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      drawerOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      lines,
      itemCount,
      subtotal,
      drawerOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
