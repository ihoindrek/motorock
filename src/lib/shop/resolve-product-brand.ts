import { brands } from "@/data/brands";
import type {
  GraphQLMetaData,
  GraphQLProductAttribute,
} from "@/lib/graphql/types";
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
    .map((value) => value?.trim().toLowerCase() ?? "")
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

function readMetaValue(
  meta: GraphQLMetaData[] | null | undefined,
  key: string,
) {
  return meta?.find((entry) => entry.key === key)?.value?.trim() ?? "";
}

/** Infer equipment brand from Shopify/Motomad import metadata when pa_brand is missing. */
export function resolveEquipmentBrandFromImportMeta(
  meta?: GraphQLMetaData[] | null,
): string | undefined {
  const shopifySiteId = readMetaValue(meta, "_shopify_site_id").toLowerCase();

  if (shopifySiteId.includes("motogirl")) {
    return "Motogirl";
  }

  if (shopifySiteId.includes("pando")) {
    return "Pando Moto";
  }

  const catalogAdapter = readMetaValue(meta, "_catalog_adapter").toLowerCase();
  if (catalogAdapter === "johndoe" || catalogAdapter === "john-doe") {
    return "John Doe";
  }

  const fbBrand = readMetaValue(meta, "fb_brand");
  if (fbBrand) {
    const fromMeta = resolveBrandNameFromSlug(fbBrand, { equipmentOnly: true });
    if (fromMeta) {
      return fromMeta;
    }
  }

  const importSource = readMetaValue(meta, "_import_source");
  const motomadProductId = readMetaValue(meta, "_motomad_product_id");
  const shopifyProductId = readMetaValue(meta, "_shopify_product_id");

  if (
    importSource === "motomad" &&
    motomadProductId &&
    !shopifyProductId &&
    !shopifySiteId
  ) {
    return "Motogirl";
  }

  return undefined;
}

export function resolveEquipmentBrandFromSku(
  sku: string | null | undefined,
): string | undefined {
  const normalized = sku?.trim().toUpperCase() ?? "";
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("NANDI")) {
    return "Motogirl";
  }

  if (normalized.startsWith("BH")) {
    return "Bobhead";
  }

  if (normalized.startsWith("PANDO") || normalized.startsWith("PM-")) {
    return "Pando Moto";
  }

  if (
    /^(JW|JLE800|JHK800|MJDD|MJDC|JDD|JDC|JDOV|IJ)/.test(normalized)
  ) {
    return "John Doe";
  }

  return undefined;
}

/** Match equipment brands from the product title (e.g. "MotoGirl Mid-Layer Leggings"). */
export function resolveEquipmentBrandFromProductName(
  productName: string,
): string | undefined {
  const lower = productName.trim().toLowerCase();

  if (lower.startsWith("mg ") || lower.startsWith("mg-")) {
    return "Motogirl";
  }

  for (const brand of brands) {
    if (MOTORCYCLE_BRAND_SLUGS.has(brand.slug)) {
      continue;
    }

    const nameLower = brand.name.toLowerCase();

    if (lower.includes(nameLower)) {
      return brand.name;
    }

    // Multi-word brands must match the full name — avoid "john" matching John Doe.
    if (nameLower.includes(" ")) {
      continue;
    }

    const needle = nameLower.split(/\s+/)[0];
    if (needle.length > 2 && lower.includes(needle)) {
      return brand.name;
    }
  }

  return undefined;
}

export function resolveEquipmentBrand(
  productName: string,
  attributes?: { nodes: GraphQLProductAttribute[] } | null,
  meta?: GraphQLMetaData[] | null,
  sku?: string | null,
): string {
  const fromBrandAttribute = resolveBrandFromProductAttributes(attributes, {
    equipmentOnly: true,
  });

  if (fromBrandAttribute) {
    return fromBrandAttribute;
  }

  const brandAttribute = attributes?.nodes.find(
    (attribute) => normalizeAttributeName(attribute.name) === "brand",
  );
  const brandSlug = brandAttribute?.options?.[0];

  if (brandSlug) {
    const fromSlug = resolveBrandNameFromSlug(brandSlug, { equipmentOnly: true });
    if (fromSlug) {
      return fromSlug;
    }

    return brandSlug
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const fromImportMeta = resolveEquipmentBrandFromImportMeta(meta);
  if (fromImportMeta) {
    return fromImportMeta;
  }

  const fromSku = resolveEquipmentBrandFromSku(sku);
  if (fromSku) {
    return fromSku;
  }

  const fromName = resolveEquipmentBrandFromProductName(productName);
  if (fromName) {
    return fromName;
  }

  return "Motorock";
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
