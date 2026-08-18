import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog-product";

const DISPLACEMENT_MIN = 50;
const DISPLACEMENT_MAX = 2000;

const DISPLACEMENT_SPEC_LABEL =
  /engine capacity|engine displacement|displacement|mootori toomaht|töömaht/i;

function isLikelyModelYear(value: number) {
  return value >= 1900 && value <= 2099;
}

function normalizeDisplacement(value: number) {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value);

  if (
    rounded < DISPLACEMENT_MIN ||
    rounded > DISPLACEMENT_MAX ||
    isLikelyModelYear(rounded)
  ) {
    return undefined;
  }

  return rounded;
}

function parseDisplacementFromText(text: string) {
  const explicitMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:cc|cm³|cm3)\b/i);
  if (explicitMatch) {
    return normalizeDisplacement(Number(explicitMatch[1]));
  }

  const gluedMatch = text.match(/\b(\d{2,4})cc\b/i);
  if (gluedMatch) {
    return normalizeDisplacement(Number(gluedMatch[1]));
  }

  const withoutYears = text.replace(/\b(19|20)\d{2}\b/g, " ");
  const embeddedMatch = withoutYears.match(
    /(?:^|[\s(])(\d{2,4})(?=[A-Za-z]|\s|$|[\-,)])/,
  );
  if (embeddedMatch) {
    const fromEmbedded = normalizeDisplacement(Number(embeddedMatch[1]));
    if (fromEmbedded != null) {
      return fromEmbedded;
    }
  }

  const candidates = withoutYears.match(/\b(\d{2,4})\b/g) ?? [];
  const parsed = candidates
    .map((candidate) => normalizeDisplacement(Number(candidate)))
    .filter((value): value is number => value != null);

  return parsed.at(-1);
}

function resolveDisplacementFromSpecs(product: CatalogProduct) {
  const specs = [
    ...(product.engineSpecs ?? []),
    ...(product.moreEngineSpecs ?? []),
    ...(product.generalSpecs ?? []),
    ...product.specs,
  ];

  for (const spec of specs) {
    if (!DISPLACEMENT_SPEC_LABEL.test(spec.label)) {
      continue;
    }

    const fromValue = parseDisplacementFromText(spec.value);
    if (fromValue != null) {
      return fromValue;
    }
  }

  return undefined;
}

function resolveDisplacementFromSlug(slug: string) {
  const match = slug.match(/-(\d{2,4})(?:-|$)/);
  if (!match) {
    return undefined;
  }

  return normalizeDisplacement(Number(match[1]));
}

export function resolveProductDisplacement(
  product: CatalogProduct,
): number | undefined {
  if (product.type !== "motorcycle") {
    return undefined;
  }

  return (
    resolveDisplacementFromSpecs(product) ??
    parseDisplacementFromText(product.name) ??
    parseDisplacementFromText(product.slug.replace(/-/g, " ")) ??
    resolveDisplacementFromSlug(product.slug)
  );
}

export function resolveAvailableDisplacements(
  products: readonly CatalogProduct[],
) {
  const values = new Set<number>();

  for (const product of products) {
    const displacement = resolveProductDisplacement(product);
    if (displacement != null) {
      values.add(displacement);
    }
  }

  return [...values].sort((left, right) => left - right);
}

export function shouldShowMotorcycleDisplacementFilter(
  routeCategory: string | undefined,
  displacements: readonly number[],
) {
  return routeCategory === "motorcycles" && displacements.length > 1;
}

export function matchDisplacementsFromParam(
  param: string,
  available: readonly number[],
) {
  const wanted = new Set(
    param
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value)),
  );

  return available.filter((value) => wanted.has(value));
}

export function formatDisplacementLabel(value: number, locale: Locale) {
  return locale === "et" ? `${value} cm³` : `${value} cc`;
}
