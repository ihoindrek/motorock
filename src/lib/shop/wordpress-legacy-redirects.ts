import type { Locale } from "@/i18n/config";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
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

/** Old WPML / WordPress ET page slugs → canonical storefront paths (no locale). */
const LEGACY_STATIC_PAGE_SLUGS: Record<string, string> = {
  kontakt: "/contact",
  meist: "/about",
  blogi: "/blog",
  seadmed: "/tootekategooria",
  privaatsus: "/privacy",
  tingimused: "/terms",
  tagastus: "/returns",
  tarne: "/shipping",
  kupsised: "/cookies",
  abi: "/support",
  "proovisoid": "/test-ride",
  "proovisõit": "/test-ride",
};

/**
 * WordPress served posts at `/{slug}`; the storefront uses `/blog/{slug}`.
 * Keep in sync with published WP posts. Locale is inferred from which set matches.
 */
const LEGACY_BLOG_ROOT_SLUGS_EN = new Set([
  "brixton-crossfire-125-review-the-full-125cc-comparison",
  "mutt-motorcycles-lineup-review",
  "brixton-cromwell-125-review",
  "brixton-crossfire-500-storr-review-2",
  "brixton-cromwell-1200-review",
  "holyfreedom-primaloft-vs-standard-tubulars",
  "win-a-brixton-crossfire-500-storr-motorock-giveaway-2026",
  "moto-125-motorcycles-2026-guide",
  "holyfreedom-stealth-helmet-before-you-buy",
  "motogirl-motorcycle-gear-for-women-riders",
  "motorcycle-bushcraft-backpack",
  "scrambler-motorcycle-gear",
  "brixton-motorcycle-accessories-guide",
  "motorcycle-neck-gaiter-stay-warm-while-riding",
]);

const LEGACY_BLOG_ROOT_SLUGS_ET = new Set([
  "brixton-crossfire-125-ulevaade-125-cm³-mootorrataste-pohjalik-vordlus",
  "parimad-mutt-250cc-mootorrattad-milline-mudel-sobib-just-sulle",
  "brixton-cromwell-125-ulevaade-nutikas-esimene-jalgratas-linnasoitjatele",
  "brixton-crossfire-500-storr-ulevaade-koos-pagasiga-alla-8-000-euro",
  "brixton-cromwell-1200-ulevaade-toeliste-teede-jaoks-loodud-scrambler",
  "holyfreedom-primaloft-vs-tavalised-torukujulised-soojendajad-milline-on-erinevus",
  "voida-brixton-crossfire-500-storr-motorocki-auhinnamang-2026",
  "moto-125-mootorrattad-parimad-125-cm³-mootorrattad-2026-aastal",
  "holyfreedom-stealth-kiiver-enne-ostmist",
  "motogirl-mootorratturi-varustus-naissoost-soitjatele",
  "parimad-mootorratta-ja-bushcraft-seljakotid",
  "scrambleri-mootorratturi-varustus-mis-oma-hinda-vaart-on",
  "brixtoni-mootorratta-tarvikud-mida-sa-tana-vajad",
  "mootorratta-kaelussall-hoiab-soidu-ajal-soojas",
]);

const LEGACY_BLOG_ROOT_SLUGS = new Set([
  ...LEGACY_BLOG_ROOT_SLUGS_EN,
  ...LEGACY_BLOG_ROOT_SLUGS_ET,
]);

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function inferLocaleFromBlogRootSlug(slug: string): Locale | null {
  if (LEGACY_BLOG_ROOT_SLUGS_EN.has(slug)) {
    return "en";
  }

  if (LEGACY_BLOG_ROOT_SLUGS_ET.has(slug)) {
    return "et";
  }

  return null;
}

const ET_LEGACY_STATIC_SLUGS = new Set(Object.keys(LEGACY_STATIC_PAGE_SLUGS));

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

function resolveProductCategoryRedirect(
  pathname: string,
  locale: Locale,
): string | null {
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
      return buildBrandCatalogHref(locale, brand);
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
    normalized === "/pood" ||
    normalized.startsWith("/pood/") ||
    normalized === "/seadmed" ||
    normalized === "/blogi" ||
    normalized.startsWith("/blogi/")
  ) {
    return "et";
  }

  const staticSlug = decodePathSegment(normalized.slice(1));
  if (staticSlug && !staticSlug.includes("/")) {
    if (ET_LEGACY_STATIC_SLUGS.has(staticSlug)) {
      return "et";
    }

    const blogLocale = inferLocaleFromBlogRootSlug(staticSlug);
    if (blogLocale) {
      return blogLocale;
    }
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

  if (normalized.startsWith("/blogi/")) {
    return `/blog/${normalized.slice("/blogi/".length)}`;
  }

  const staticSlug = decodePathSegment(normalized.slice(1));
  if (staticSlug && !staticSlug.includes("/")) {
    const staticTarget = LEGACY_STATIC_PAGE_SLUGS[staticSlug];
    if (staticTarget) {
      return redirectUnlessSame(normalized, staticTarget);
    }

    if (LEGACY_BLOG_ROOT_SLUGS.has(staticSlug)) {
      return `/blog/${staticSlug}`;
    }
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

  if (normalized === "/pood/mootorrattad") {
    return "/shop/motorcycles";
  }

  const productCategoryTarget = resolveProductCategoryRedirect(
    normalized,
    locale,
  );
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
