import type { ProductType } from "@/types/catalog-product";

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  type?: ProductType;
};

const STORAGE_KEY = "motorock-recently-viewed";
const MAX_ITEMS = 12;

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: RecentlyViewedItem) {
  if (typeof window === "undefined" || !item.slug) {
    return;
  }

  const next = [
    item,
    ...readRecentlyViewed().filter((entry) => entry.slug !== item.slug),
  ].slice(0, MAX_ITEMS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — the feature is best-effort.
  }
}
