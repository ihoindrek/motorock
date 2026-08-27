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
import { readLocalStorage, writeLocalStorage, removeLocalStorage } from "@/lib/client/storage";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";
import { formatSizeLabel, isOneSizeLabel } from "@/lib/shop/size-label";

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
  legLength?: string;
  productId?: number;
  variationId?: number;
  /** EN catalog ids for Meta / GA4 (WPML ET lines keep localized Woo ids above). */
  metaCatalogProductId?: number;
  metaCatalogVariationId?: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  /** True after localStorage cart has been read on the client. */
  hydrated: boolean;
  drawerOpen: boolean;
  /** Set when the drawer opens right after add-to-cart (for highlight UX). */
  lastAddedLineKey: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  addItemAndOpenCart: (
    line: Omit<CartLine, "quantity"> & { quantity?: number },
  ) => void;
  removeItem: (slug: string, size?: string, color?: string, legLength?: string) => void;
  updateQuantity: (
    slug: string,
    quantity: number,
    size?: string,
    color?: string,
    legLength?: string,
  ) => void;
  clearCart: () => void;
  /** Replace the whole cart, e.g. when restoring an abandoned order. */
  replaceCart: (lines: CartLine[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "motorock-cart";

function lineKey(slug: string, size?: string, color?: string, legLength?: string) {
  return [slug, size ?? "", color ?? "", legLength ?? ""].join(":");
}

export function cartLineKey(
  line: Pick<CartLine, "slug" | "size" | "color" | "legLength">,
) {
  return lineKey(line.slug, line.size, line.color, line.legLength);
}

function readStoredLines(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = readLocalStorage(STORAGE_KEY);
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
  const [lastAddedLineKey, setLastAddedLineKey] = useState<string | null>(null);

  const openCart = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setDrawerOpen(false);
    setLastAddedLineKey(null);
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

    writeLocalStorage(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const normalizedSize =
        line.size && !isOneSizeLabel(line.size)
          ? formatSizeLabel(line.size)
          : line.size;

      setLines((current) => {
        const key = lineKey(line.slug, normalizedSize, line.color, line.legLength);
        const existing = current.find(
          (item) =>
            lineKey(item.slug, item.size, item.color, item.legLength) === key,
        );

        if (existing) {
          return current.map((item) =>
            lineKey(item.slug, item.size, item.color, item.legLength) === key
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
            legLength: line.legLength,
            productId: line.productId,
            variationId: line.variationId,
            metaCatalogProductId: line.metaCatalogProductId,
            metaCatalogVariationId: line.metaCatalogVariationId,
            quantity: line.quantity ?? 1,
          },
        ];
      });

      trackAddToCart({
        slug: line.slug,
        name: line.name,
        price: line.price,
        image: line.image,
        brand: line.brand,
        type: line.type,
        size: normalizedSize,
        color: line.color,
        legLength: line.legLength,
        productId: line.productId,
        variationId: line.variationId,
        metaCatalogProductId: line.metaCatalogProductId,
        metaCatalogVariationId: line.metaCatalogVariationId,
        quantity: line.quantity ?? 1,
      });
    },
    [],
  );

  const addItemAndOpenCart = useCallback(
    (line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const normalizedSize =
        line.size && !isOneSizeLabel(line.size)
          ? formatSizeLabel(line.size)
          : line.size;

      setLastAddedLineKey(
        lineKey(line.slug, normalizedSize, line.color, line.legLength),
      );
      setDrawerOpen(true);
      addItem({ ...line, size: normalizedSize });
    },
    [addItem],
  );

  const removeItem = useCallback(
    (slug: string, size?: string, color?: string, legLength?: string) => {
    const key = lineKey(slug, size, color, legLength);
    setLines((current) => {
      const removed = current.find(
        (item) =>
          lineKey(item.slug, item.size, item.color, item.legLength) === key,
      );
      if (removed) {
        trackRemoveFromCart(removed);
      }

      return current.filter(
        (item) =>
          lineKey(item.slug, item.size, item.color, item.legLength) !== key,
      );
    });
  },
  []);

  const updateQuantity = useCallback(
    (
      slug: string,
      quantity: number,
      size?: string,
      color?: string,
      legLength?: string,
    ) => {
      const key = lineKey(slug, size, color, legLength);

      if (quantity <= 0) {
        setLines((current) =>
          current.filter(
            (item) =>
              lineKey(item.slug, item.size, item.color, item.legLength) !== key,
          ),
        );
        return;
      }

      setLines((current) =>
        current.map((item) =>
          lineKey(item.slug, item.size, item.color, item.legLength) === key
            ? { ...item, quantity }
            : item,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setLines([]);
    // Also clear storage synchronously: on a fresh page load (e.g. the
    // thank-you page after an external payment) this runs before the
    // provider's hydration effect, which would otherwise read the stored
    // lines from localStorage and restore the cart right back.
    if (typeof window !== "undefined") {
      removeLocalStorage(STORAGE_KEY);
    }
  }, []);

  const replaceCart = useCallback((nextLines: CartLine[]) => {
    const normalized = nextLines.map((line) => ({
      ...line,
      size:
        line.size && !isOneSizeLabel(line.size)
          ? formatSizeLabel(line.size)
          : line.size,
      quantity: Math.max(1, line.quantity),
    }));

    setLines(normalized);
    // Write through synchronously for the same hydration-race reason as
    // clearCart: a restore link triggers this right after a fresh page load.
    if (typeof window !== "undefined") {
      writeLocalStorage(STORAGE_KEY, JSON.stringify(normalized));
    }
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
      hydrated,
      drawerOpen,
      lastAddedLineKey,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      addItemAndOpenCart,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
    }),
    [
      lines,
      itemCount,
      subtotal,
      hydrated,
      drawerOpen,
      lastAddedLineKey,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      addItemAndOpenCart,
      removeItem,
      updateQuantity,
      clearCart,
      replaceCart,
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
