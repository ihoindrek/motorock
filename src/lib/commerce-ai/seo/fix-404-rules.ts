import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import type { SiteLink } from "@/lib/commerce-ai/seo/site-link-inventory";
import type { RedirectSuggestion } from "@/lib/commerce-ai/seo/fix-404.service";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

/** URLs that should stay unmatched (feeds, font assets, junk). */
export function isIgnorableBrokenUrl(path: string) {
  const lower = path.toLowerCase();

  return (
    lower === "/&" ||
    lower === "/$" ||
    lower === "/mo" ||
    lower === "/kuus" ||
    /\/feed\/?$/.test(lower) ||
    /\/feed\//.test(lower) ||
    /ffff\/?$/.test(lower) ||
    /normal\d+100u0/.test(lower)
  );
}

function slugFromMatch(path: string, pattern: RegExp) {
  const match = path.match(pattern);
  return match?.[1]?.toLowerCase().replace(/\/$/, "") ?? "";
}

function findBrandTarget(slug: string, locale: Locale, inventory: SiteLink[]) {
  const normalized = slug.replace(/-et$/, "").replace(/-2$/, "");

  return inventory.find((link) => {
    if (link.type !== "category" && !link.url.includes("/brand")) {
      return false;
    }

    const linkSlug = link.slug.toLowerCase();
    const urlLower = link.url.toLowerCase();

    return (
      linkSlug === normalized ||
      linkSlug === slug ||
      urlLower.includes(`/${normalized}`) ||
      urlLower.includes(`/${slug}`)
    );
  });
}

function findPostTarget(path: string, inventory: SiteLink[]) {
  const slugGuess = path.split("/").filter(Boolean).pop()?.toLowerCase() ?? "";

  if (!slugGuess) {
    return null;
  }

  return inventory.find(
    (link) =>
      link.type === "post" &&
      (link.slug === slugGuess || link.slug.includes(slugGuess) || slugGuess.includes(link.slug)),
  );
}

/** Deterministic legacy URL → live path mapping (no AI). */
export function suggestRuleBasedRedirect(
  from: string,
  locale: Locale,
  inventory: SiteLink[],
): RedirectSuggestion | null {
  if (isIgnorableBrokenUrl(from)) {
    return null;
  }

  const lower = from.toLowerCase();

  // Legacy paginated shop listings → equipment hub.
  if (/\/shop\/page\/\d+/i.test(lower) || /\/pood\/page\/\d+/i.test(lower)) {
    return {
      from,
      to: localizedHref(locale, buildEquipmentHubHref(locale)),
      confidence: "high",
      reason: "Legacy paginated shop archive",
    };
  }

  // /equipment/ hub.
  if (lower === "/equipment/" || lower === "/equipment") {
    return {
      from,
      to: localizedHref(locale, buildEquipmentHubHref(locale)),
      confidence: "high",
      reason: "Legacy equipment hub",
    };
  }

  // ET custom landing pages.
  if (lower.includes("vonastatud-rattad")) {
    return {
      from,
      to: localizedHref("et", "/shop/motorcycles"),
      confidence: "high",
      reason: "Legacy ET motorcycles landing",
    };
  }

  // /brand/slug/ or /et/brand/slug/ → canonical brand catalog.
  const brandSlug =
    slugFromMatch(lower, /\/brand\/([^/?]+)/) ||
    slugFromMatch(lower, /\/bränd\/([^/?]+)/) ||
    slugFromMatch(lower, /\/brandid\/([^/?]+)/);

  if (brandSlug) {
    const brandLink = findBrandTarget(brandSlug, locale, inventory);
    const to = brandLink?.url ?? localizedHref(locale, buildBrandCatalogHref(locale, brandSlug));

    return {
      from,
      to,
      targetTitle: brandLink?.title,
      confidence: brandLink ? "high" : "medium",
      reason: "Legacy brand archive",
    };
  }

  // /shop/brixton, /shop/mutt → brand or motorcycles hub.
  const shopSlug = slugFromMatch(lower, /\/shop\/([a-z0-9-]+)$/);
  if (shopSlug && !shopSlug.startsWith("page")) {
    if (shopSlug === "motron" || shopSlug === "mutt" || shopSlug === "malaguti") {
      return {
        from,
        to: localizedHref(locale, "/shop/motorcycles"),
        confidence: "high",
        reason: "Legacy motorcycle brand shop slug",
      };
    }

    const brandLink = findBrandTarget(shopSlug, locale, inventory);
    if (brandLink) {
      return {
        from,
        to: brandLink.url,
        targetTitle: brandLink.title,
        confidence: "high",
        reason: "Legacy /shop/{brand} URL",
      };
    }
  }

  // /en/shop/tooriistad-ja-hooldus → tools category.
  if (lower.includes("tooriistad-ja-hooldus") || lower.includes("tools-maintenance")) {
    return {
      from,
      to: localizedHref(locale, locale === "et" ? "/shop/tooriistad-ja-hooldus" : "/shop/tools"),
      confidence: "high",
      reason: "Legacy tools category slug",
    };
  }

  // Blog posts — match by slug in inventory.
  if (lower.includes("/blog/")) {
    const postLink = findPostTarget(lower, inventory);
    if (postLink) {
      return {
        from,
        to: postLink.url,
        targetTitle: postLink.title,
        confidence: "high",
        reason: "Matching journal post",
      };
    }
  }

  // ET tag/category archives → blog or equipment hub as fallback.
  if (lower.includes("/tag/") || lower.includes("/category/")) {
    return {
      from,
      to: localizedHref(locale, "/blog"),
      confidence: "low",
      reason: "Legacy tag/category archive — review manually",
    };
  }

  return null;
}
