import { getWooStoreUrl } from "@/lib/storefront/url";
import {
  formatSizeLabel,
  isOneSizeLabel,
  sizesMatch,
  stripSizeLocaleSuffix,
} from "@/lib/shop/size-label";
import {
  cartSizeToWooSizeSlug,
  colorToWooColorSlug,
  euUkSizesMatch,
} from "@/lib/shop/eu-uk-size";
import { shouldMapColorToPaSize } from "@/lib/shop/product-variation-dimensions";

type StoreAttributeTerm = {
  name: string;
  slug: string;
};

type StoreProductAttribute = {
  name: string;
  taxonomy?: string;
  terms?: StoreAttributeTerm[];
};

type StoreProductVariation = {
  id: number;
  attributes: Array<{ name: string; value: string | null }>;
};

type StoreProduct = {
  id: number;
  type: string;
  variations?: StoreProductVariation[];
  attributes?: StoreProductAttribute[];
};

const storeProductCache = new Map<number, StoreProduct>();

function normalizeAttributeName(name: string) {
  return name.toLowerCase().replace(/^pa_/, "");
}

function isSizeAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  if (isLegLengthAttribute(name)) {
    return false;
  }

  return normalized === "size" || normalized === "suurus" || normalized.includes("size");
}

function isColorAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  return (
    normalized === "color" ||
    normalized === "colour" ||
    normalized === "värv" ||
    normalized === "finish"
  );
}

function isLegLengthAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  return (
    normalized === "leg length" ||
    normalized === "leg-length" ||
    normalized === "jala pikkus"
  );
}

function sizeValuesMatch(cartSize: string, wooValue: string) {
  if (sizesMatch(cartSize, wooValue)) {
    return true;
  }

  return euUkSizesMatch(cartSize, wooValue);
}

function findProductAttribute(product: StoreProduct, attributeName: string) {
  const target = normalizeAttributeName(attributeName);
  return product.attributes?.find(
    (attribute) => normalizeAttributeName(attribute.name) === target,
  );
}

function productAttributeTaxonomy(attribute: StoreProductAttribute) {
  const taxonomy = attribute.taxonomy?.trim().toLowerCase();
  if (taxonomy) {
    return taxonomy;
  }

  return wooPaAttributeName(attribute.name);
}

function resolveAttributeValueSlug(
  attribute: StoreProductAttribute,
  value: string,
) {
  const normalized = value.trim().toLowerCase();
  const match = attribute.terms?.find(
    (term) =>
      term.slug.trim().toLowerCase() === normalized ||
      term.name.trim().toLowerCase() === normalized,
  );

  return match?.slug ?? value.trim();
}

function colorValueMatches(
  variationValue: string | null | undefined,
  selectedColor: string,
  terms?: StoreAttributeTerm[],
) {
  const rawValue = variationValue?.trim();
  if (!rawValue) {
    return false;
  }

  const normalizedSelected = selectedColor.toLowerCase();
  const normalizedValue = rawValue.toLowerCase();

  if (normalizedValue === normalizedSelected) {
    return true;
  }

  const term = terms?.find(
    (entry) =>
      entry.slug.toLowerCase() === normalizedSelected ||
      entry.slug.toLowerCase() === normalizedValue ||
      entry.name.toLowerCase() === normalizedSelected ||
      entry.name.toLowerCase() === normalizedValue,
  );

  if (!term) {
    return false;
  }

  return (
    term.slug.toLowerCase() === normalizedSelected ||
    term.name.toLowerCase() === normalizedSelected ||
    term.slug.toLowerCase() === normalizedValue
  );
}

export async function fetchStoreProduct(productId: number) {
  const cached = storeProductCache.get(productId);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${getWooStoreUrl()}/wp-json/wc/store/v1/products/${productId}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const product = (await response.json()) as StoreProduct;
    storeProductCache.set(productId, product);
    return product;
  } catch {
    // Store API is server-only in practice (no ACAO for motorock.eu in browser).
    return null;
  }
}

export function buildVariationIdsFromStoreProduct(product: StoreProduct) {
  const variationIds: Record<string, number> = {};
  const colorTerms =
    product.attributes?.find((attribute) => isColorAttribute(attribute.name))
      ?.terms ?? [];

  for (const variation of product.variations ?? []) {
    const size = variation.attributes.find((attribute) =>
      isSizeAttribute(attribute.name),
    );
    const color = variation.attributes.find((attribute) =>
      isColorAttribute(attribute.name),
    );

    if (size?.value?.trim()) {
      const raw = size.value.trim();
      const label = formatSizeLabel(raw);
      variationIds[raw] = variation.id;
      if (label) {
        variationIds[label] = variation.id;
      }
      variationIds[raw.toLowerCase()] = variation.id;
    }

    if (color?.value?.trim()) {
      const colorValue = color.value.trim();
      variationIds[colorValue] = variation.id;

      const term = colorTerms.find(
        (entry) => entry.slug?.trim().toLowerCase() === colorValue.toLowerCase(),
      );
      if (term?.slug) {
        variationIds[term.slug] = variation.id;
      }
      if (term?.name?.trim()) {
        variationIds[term.name.trim()] = variation.id;
      }
    }
  }

  return Object.keys(variationIds).length > 0 ? variationIds : undefined;
}

function variationMatchesInput(
  variation: StoreProductVariation,
  input: { size?: string; color?: string; legLength?: string },
  colorTerms: StoreAttributeTerm[],
) {
  const size = variation.attributes.find((attribute) =>
    isSizeAttribute(attribute.name),
  );
  const color = variation.attributes.find((attribute) =>
    isColorAttribute(attribute.name),
  );
  const leg = variation.attributes.find((attribute) =>
    isLegLengthAttribute(attribute.name),
  );

  const sizeIsGeneric = isOneSizeLabel(input.size);
  const sizeValue = size?.value?.trim();
  const sizeMatches =
    sizeIsGeneric ||
    !input.size?.trim() ||
    (typeof sizeValue === "string" && sizeValuesMatch(input.size, sizeValue));

  const colorMatches =
    !input.color?.trim() ||
    (Boolean(color) &&
      colorValueMatches(color!.value, input.color!, colorTerms));

  const legMatches =
    !input.legLength?.trim() ||
    (Boolean(leg?.value?.trim()) &&
      leg!.value!.trim().toLowerCase() === input.legLength!.trim().toLowerCase());

  return sizeMatches && colorMatches && legMatches;
}

function hasExplicitVariationSelection(input: {
  size?: string;
  color?: string;
  legLength?: string;
}) {
  return (
    (Boolean(input.size?.trim()) && !isOneSizeLabel(input.size)) ||
    Boolean(input.color?.trim()) ||
    Boolean(input.legLength?.trim())
  );
}

export function findStoreVariationId(
  product: StoreProduct,
  input: { size?: string; color?: string; legLength?: string },
) {
  const variations = product.variations ?? [];
  if (variations.length === 0) {
    return undefined;
  }

  const colorTerms =
    product.attributes?.find((attribute) => isColorAttribute(attribute.name))
      ?.terms ?? [];

  if (variations.length === 1) {
    const only = variations[0];
    if (
      hasExplicitVariationSelection(input) &&
      !variationMatchesInput(only, input, colorTerms)
    ) {
      return undefined;
    }

    return only.id;
  }

  const matched = variations.find((variation) =>
    variationMatchesInput(variation, input, colorTerms),
  );

  return matched?.id;
}

export async function resolveStoreVariationId(
  productId: number,
  input: { size?: string; color?: string; legLength?: string },
) {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams({ productId: String(productId) });
      if (input.size) {
        params.set("size", input.size);
      }
      if (input.color) {
        params.set("color", input.color);
      }
      if (input.legLength) {
        params.set("legLength", input.legLength);
      }

      const response = await fetch(
        `/api/checkout/resolve-variation?${params.toString()}`,
        { cache: "no-store" },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          variationId?: number | null;
        };
        return payload.variationId ?? undefined;
      }
    } catch {
      // Fall through to direct Store API (server components / tests).
    }

    return undefined;
  }

  const product = await fetchStoreProduct(productId);
  if (!product || product.type !== "variable") {
    return undefined;
  }

  return findStoreVariationId(product, input);
}

export type WooVariationAttributeInput = {
  attributeName: string;
  attributeValue: string;
};

function wooPaAttributeName(attributeName: string) {
  const normalized = attributeName.trim().toLowerCase();
  if (normalized.startsWith("pa_")) {
    return normalized;
  }

  if (
    normalized === "värv" ||
    normalized === "color"
  ) {
    return "pa_color";
  }

  if (normalized === "colour") {
    return "pa_colour";
  }

  if (isSizeAttribute(attributeName)) {
    return "pa_size";
  }

  if (isLegLengthAttribute(attributeName)) {
    return "pa_leg-length";
  }

  return `pa_${normalized.replace(/\s+/g, "-")}`;
}

/** Convert cart/UI size label to Woo `pa_size` slug (no Store API needed). */
export function cartSizeToWooAttributeSlug(size: string) {
  const formatted = formatSizeLabel(size.trim());
  if (/^W\d+\/L\d+$/i.test(formatted)) {
    return formatted.replace(/^W/i, "w").replace("/", "-").toLowerCase();
  }

  return stripSizeLocaleSuffix(formatted).toLowerCase();
}

/** Convert cart/UI size label to Woo `pa_size` slug (no Store API needed). */
export function buildAddToCartVariationAttributesFromCartLine(line: {
  size?: string;
  color?: string;
  legLength?: string;
}) {
  const attributes: WooVariationAttributeInput[] = [];

  if (line.legLength?.trim()) {
    attributes.push({
      attributeName: "pa_leg-length",
      attributeValue: line.legLength.trim().toLowerCase(),
    });
  }

  if (shouldMapColorToPaSize(line)) {
    attributes.push({
      attributeName: "pa_size",
      attributeValue: colorToWooColorSlug(line.color!),
    });
  } else if (line.size && !isOneSizeLabel(line.size)) {
    attributes.push({
      attributeName: "pa_size",
      attributeValue: cartSizeToWooSizeSlug(line.size),
    });
  }

  if (line.color && !shouldMapColorToPaSize(line)) {
    attributes.push({
      attributeName: "pa_color",
      attributeValue: colorToWooColorSlug(line.color),
    });
  }

  return attributes;
}

/** Map cart size label to Woo `pa_size` slug using Store API terms when available. */
export function resolveSizeAttributeSlug(size: string, product: StoreProduct) {
  const terms =
    product.attributes?.find((attribute) => isSizeAttribute(attribute.name))
      ?.terms ?? [];
  const formatted = formatSizeLabel(size);
  const candidates = new Set(
    [
      size.trim(),
      stripSizeLocaleSuffix(size),
      formatted,
      formatted.replace("/", "-"),
      formatted.replace(/^W/i, "w").replace("/", "-"),
    ]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  const match = terms.find((term) => {
    const slug = term.slug.trim().toLowerCase();
    const name = term.name.trim().toLowerCase();
    return candidates.has(slug) || candidates.has(name);
  });

  if (match) {
    return match.slug;
  }

  return cartSizeToWooAttributeSlug(size);
}

/** Some variable products reject addToCart unless pa_size/pa_color are sent too. */
export function buildAddToCartVariationAttributes(
  product: StoreProduct,
  line: { size?: string; color?: string },
  variationId?: number,
): WooVariationAttributeInput[] {
  const attributes: WooVariationAttributeInput[] = [];

  if (line.size && !isOneSizeLabel(line.size)) {
    const sizeAttr = product.attributes?.find((attribute) =>
      isSizeAttribute(attribute.name),
    );
    if (sizeAttr) {
      attributes.push({
        attributeName: productAttributeTaxonomy(sizeAttr),
        attributeValue: resolveSizeAttributeSlug(line.size, product),
      });
    }
  }

  if (line.color) {
    const colorAttr = product.attributes?.find((attribute) =>
      isColorAttribute(attribute.name),
    );
    if (colorAttr) {
      const terms = colorAttr.terms ?? [];
      const normalized = line.color.trim().toLowerCase();
      const match = terms.find(
        (term) =>
          term.slug.toLowerCase() === normalized ||
          term.name.toLowerCase() === normalized,
      );

      attributes.push({
        attributeName: productAttributeTaxonomy(colorAttr),
        attributeValue: match?.slug ?? normalized,
      });
    }
  }

  if (
    attributes.length === 0 &&
    variationId &&
    product.variations?.length
  ) {
    const variation = product.variations.find((entry) => entry.id === variationId);
    for (const attribute of variation?.attributes ?? []) {
      const value = attribute.value?.trim();
      if (!value) {
        continue;
      }

      const productAttr = findProductAttribute(product, attribute.name);
      if (!productAttr) {
        continue;
      }

      attributes.push({
        attributeName: productAttributeTaxonomy(productAttr),
        attributeValue: resolveAttributeValueSlug(productAttr, value),
      });
    }
  }

  return attributes;
}

/** Prefer Store API slugs from the resolved variation — avoids Woo "Invalid value posted" errors. */
export async function buildCheckoutAddToCartVariationAttributes(
  productId: number,
  line: { size?: string; color?: string; legLength?: string },
  variationId?: number,
) {
  const product = await fetchStoreProduct(productId);
  if (product && variationId) {
    const fromStore = buildAddToCartVariationAttributes(product, line, variationId);
    if (fromStore.length > 0) {
      return fromStore;
    }
  }

  return buildAddToCartVariationAttributesFromCartLine(line);
}

export async function enrichCatalogProductVariations<
  T extends {
    databaseId?: number;
    variationIds?: Readonly<Record<string, number>>;
    variations?: ReadonlyArray<{ databaseId?: number; sku: string; color: string }>;
  },
>(product: T): Promise<T> {
  if (!product.databaseId) {
    return product;
  }

  if (product.variationIds && Object.keys(product.variationIds).length > 0) {
    return product;
  }

  const storeProduct = await fetchStoreProduct(product.databaseId);
  if (!storeProduct?.variations?.length) {
    return product;
  }

  const variationIds = buildVariationIdsFromStoreProduct(storeProduct);
  if (!variationIds) {
    return product;
  }

  const variations =
    product.variations && product.variations.length > 0
      ? product.variations
      : storeProduct.variations.map((variation) => {
          const color =
            variation.attributes.find((attribute) =>
              isColorAttribute(attribute.name),
            )?.value ?? "Default";

          return {
            databaseId: variation.id,
            sku: `${product.databaseId}-${variation.id}`,
            color,
          };
        });

  return {
    ...product,
    variationIds,
    variations,
  };
}
