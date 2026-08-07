import { brands } from "@/data/brands";
import type { GraphQLProductAttribute } from "@/lib/graphql/types";
import { getCanonicalBrandName } from "@/lib/shop/brands";

const MOTORCYCLE_BRAND_SLUGS = new Set(["brixton", "mutt", "motron", "malaguti"]);

function normalizeAttributeName(name: string) {
  return name.toLowerCase().replace(/^pa_/, "");
}

function collectBrandSlugsFromAttribute(
  attribute: GraphQLProductAttribute,
): string[] {
  const fromTerms = (attribute.terms?.nodes ?? []).map((term) => term.slug);
  const fromOptions = attribute.options ?? [];

  return [...fromTerms, ...fromOptions]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function resolveBrandNameFromSlug(
  slug: string,
  options?: { motorcycleOnly?: boolean; equipmentOnly?: boolean },
): string | undefined {
  const normalized = slug.toLowerCase().replace(/^pa_/, "");

  const fromConfig = brands.find((brand) => {
    if (options?.motorcycleOnly && !MOTORCYCLE_BRAND_SLUGS.has(brand.slug)) {
      return false;
    }

    if (options?.equipmentOnly && MOTORCYCLE_BRAND_SLUGS.has(brand.slug)) {
      return false;
    }

    return (
      brand.slug === normalized ||
      brand.slug.replace(/-/g, "") === normalized.replace(/-/g, "") ||
      brand.slug.startsWith(`${normalized}-`) ||
      normalized.startsWith(`${brand.slug}-`) ||
      brand.name.toLowerCase().startsWith(normalized)
    );
  });

  if (fromConfig) {
    return fromConfig.name;
  }

  if (options?.motorcycleOnly && !MOTORCYCLE_BRAND_SLUGS.has(normalized)) {
    return undefined;
  }

  if (options?.equipmentOnly && MOTORCYCLE_BRAND_SLUGS.has(normalized)) {
    return undefined;
  }

  return getCanonicalBrandName(
    normalized
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  );
}

export function resolveBrandFromProductAttributes(
  attributes?: { nodes: GraphQLProductAttribute[] } | null,
  options?: { motorcycleOnly?: boolean; equipmentOnly?: boolean },
): string | undefined {
  const brandAttribute = attributes?.nodes.find(
    (attribute) => normalizeAttributeName(attribute.name) === "brand",
  );

  if (!brandAttribute) {
    return undefined;
  }

  for (const slug of collectBrandSlugsFromAttribute(brandAttribute)) {
    const brandName = resolveBrandNameFromSlug(slug, options);
    if (brandName) {
      return brandName;
    }
  }

  return undefined;
}

export function isMotorcycleBrandSlug(slug: string) {
  return MOTORCYCLE_BRAND_SLUGS.has(slug.toLowerCase());
}

/** Last-resort brand match from product title (e.g. "Brixton Crossfire 125"). */
export function resolveMotorcycleBrandFromProductName(
  productName: string,
): string | undefined {
  const lower = productName.trim().toLowerCase();

  for (const brand of brands) {
    if (!MOTORCYCLE_BRAND_SLUGS.has(brand.slug)) {
      continue;
    }

    const needle = brand.name.toLowerCase();

    if (lower.startsWith(needle) || lower.includes(` ${needle}`)) {
      return brand.name;
    }
  }

  return undefined;
}

/** Fixed logo-filter order for the motorcycles catalog (pa_brand slugs). */
export function getMotorcycleBrandFilterNames(): string[] {
  return brands
    .filter((brand) => MOTORCYCLE_BRAND_SLUGS.has(brand.slug))
    .map((brand) => brand.name);
}

export { MOTORCYCLE_BRAND_SLUGS };
