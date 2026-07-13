import type { Locale } from "@/i18n/config";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS } from "@/lib/shop/equipment-legacy-redirects";
import {
  canonicalizeWcCategorySlug,
  WC_SLUG_CANONICAL,
} from "@/lib/shop/wc-categories";

const EQUIPMENT_ROOT_SLUGS = new Set([
  "for-men",
  "for-women",
  "accessories",
  "helmets",
  "meestele",
  "naistele",
  "tarvikud",
  "kiivrid",
]);

const MOTORCYCLE_CATEGORY_SLUGS = new Set(["motorcycles", "mootorrattad"]);

const TOOLS_CATEGORY_SLUGS = new Set([
  "tools-maintenance",
  "tooriistad-ja-hooldus",
]);

const MOTORCYCLE_BRAND_CATEGORY_SLUGS: Record<string, string> = {
  "brixton-2": "brixton",
  "mutt-2": "mutt",
  "motron-2": "motron",
  "malaguti-2": "malaguti",
};

const SINGLE_WC_CATEGORY_REDIRECTS = buildSingleWcCategoryRedirects();

function normalizePath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function redirectUnlessSame(pathname: string, target: string) {
  return normalizePath(pathname) === normalizePath(target) ? null : target;
}

function buildSingleWcCategoryRedirects() {
  const redirects: Record<string, string> = {
    motorcycles: "/shop/motorcycles",
    mootorrattad: "/shop/motorcycles",
    "tools-maintenance": "/shop/tools-maintenance",
    "tooriistad-ja-hooldus": "/shop/tools-maintenance",
    "for-men": "/shop/equipment/for-men",
    meestele: "/shop/equipment/for-men",
    "for-women": "/shop/equipment/for-women",
    naistele: "/shop/equipment/for-women",
    accessories: "/shop/equipment/accessories",
    tarvikud: "/shop/equipment/accessories",
    helmets: "/shop/equipment/helmets",
    kiivrid: "/shop/equipment/helmets",
  };

  for (const [brandCategory, brandSlug] of Object.entries(
    MOTORCYCLE_BRAND_CATEGORY_SLUGS,
  )) {
    redirects[brandCategory] = `/shop/motorcycles?brand=${brandSlug}`;
  }

  for (const target of Object.values(LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS)) {
    if (!target) {
      continue;
    }

    const slug = target.split("/").pop();
    if (slug) {
      redirects[slug] = target;
    }
  }

  for (const [localizedSlug, canonicalSlug] of Object.entries(WC_SLUG_CANONICAL)) {
    const target = redirects[canonicalSlug];
    if (target) {
      redirects[localizedSlug] = target;
    }
  }

  return redirects;
}

function resolveProductCategoryRedirect(pathname: string): string | null {
  if (!pathname.startsWith("/product-category/")) {
    return null;
  }

  const rawSegments = pathname
    .slice("/product-category/".length)
    .split("/")
    .filter(Boolean);

  if (rawSegments.length === 0) {
    return null;
  }

  const segments = rawSegments.map(canonicalizeWcCategorySlug);

  for (const segment of segments) {
    if (MOTORCYCLE_CATEGORY_SLUGS.has(segment)) {
      return "/shop/motorcycles";
    }

    if (TOOLS_CATEGORY_SLUGS.has(segment)) {
      return "/shop/tools-maintenance";
    }

    const brand = MOTORCYCLE_BRAND_CATEGORY_SLUGS[segment];
    if (brand) {
      return `/shop/motorcycles?brand=${brand}`;
    }
  }

  const rootIndex = segments.findIndex((segment) =>
    EQUIPMENT_ROOT_SLUGS.has(segment),
  );

  if (rootIndex >= 0) {
    return `/shop/equipment/${segments.slice(rootIndex).join("/")}`;
  }

  if (segments.length === 1) {
    const single = SINGLE_WC_CATEGORY_REDIRECTS[segments[0]];
    if (single) {
      return single;
    }
  }

  return buildEquipmentHubHref("en");
}

/** Infer locale from legacy path prefixes before adding `/en` or `/et`. */
export function inferLocaleFromLegacyPath(pathname: string): Locale | null {
  const normalized = normalizePath(pathname);

  if (
    normalized === "/tootekategooria" ||
    normalized.startsWith("/tootekategooria/") ||
    normalized === "/toode" ||
    normalized.startsWith("/toode/") ||
    normalized === "/brandid" ||
    normalized.startsWith("/brandid/") ||
    normalized === "/pood"
  ) {
    return "et";
  }

  if (
    normalized === "/product" ||
    normalized.startsWith("/product/") ||
    normalized === "/product-category" ||
    normalized.startsWith("/product-category/") ||
    normalized === "/brand" ||
    normalized.startsWith("/brand/") ||
    normalized === "/shop" ||
    normalized.startsWith("/shop/") ||
    normalized === "/journal" ||
    normalized.startsWith("/journal/")
  ) {
    return "en";
  }

  return null;
}

/**
 * Maps old WordPress/WooCommerce storefront URLs to the headless Next.js routes.
 * Returns a pathname without locale prefix.
 */
export function resolveWordPressLegacyRedirect(
  pathname: string,
  locale: Locale,
): string | null {
  const normalized = normalizePath(pathname);

  if (normalized === "/journal" || normalized === "/blogi") {
    return "/blog";
  }

  if (normalized.startsWith("/journal/")) {
    return `/blog/${normalized.slice("/journal/".length)}`;
  }

  if (normalized === "/motorcycles" || normalized === "/mootorrattad") {
    return "/shop/motorcycles";
  }

  if (normalized === "/shop") {
    return locale === "et"
      ? buildEquipmentHubHref("et")
      : buildEquipmentHubHref("en");
  }

  if (normalized === "/pood") {
    return buildEquipmentHubHref("et");
  }

  const productCategoryTarget = resolveProductCategoryRedirect(normalized);
  if (productCategoryTarget) {
    return redirectUnlessSame(normalized, productCategoryTarget);
  }

  if (normalized.startsWith("/product-tag/")) {
    return locale === "et"
      ? buildEquipmentHubHref("et")
      : buildEquipmentHubHref("en");
  }

  return null;
}
