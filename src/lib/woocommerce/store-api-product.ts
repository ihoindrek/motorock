import { getWooStoreUrl } from "@/lib/storefront/url";
import {
  formatSizeLabel,
  isOneSizeLabel,
  sizesMatch,
  stripSizeLocaleSuffix,
} from "@/lib/shop/size-label";

type StoreAttributeTerm = {
  name: string;
  slug: string;
};

type StoreProductAttribute = {
  name: string;
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

export function findStoreVariationId(
  product: StoreProduct,
  input: { size?: string; color?: string },
) {
  const variations = product.variations ?? [];
  if (variations.length === 0) {
    return undefined;
  }

  if (variations.length === 1) {
    return variations[0].id;
  }

  const colorTerms =
    product.attributes?.find((attribute) => isColorAttribute(attribute.name))
      ?.terms ?? [];
  const sizeIsGeneric = isOneSizeLabel(input.size);

  const matched = variations.find((variation) => {
    const size = variation.attributes.find((attribute) =>
      isSizeAttribute(attribute.name),
    );
    const color = variation.attributes.find((attribute) =>
      isColorAttribute(attribute.name),
    );

    const sizeValue = size?.value?.trim();
    const sizeMatches =
      !sizeIsGeneric &&
      typeof input.size === "string" &&
      typeof sizeValue === "string" &&
      sizesMatch(sizeValue, input.size);

    const colorMatches =
      Boolean(input.color) &&
      Boolean(color) &&
      colorValueMatches(color!.value, input.color!, colorTerms);

    if (sizeMatches && colorMatches) {
      return true;
    }

    if (sizeMatches && !input.color) {
      return true;
    }

    if (colorMatches && sizeIsGeneric) {
      return true;
    }

    if (sizeIsGeneric && !input.color && !color) {
      return true;
    }

    return false;
  });

  return matched?.id;
}

export async function resolveStoreVariationId(
  productId: number,
  input: { size?: string; color?: string },
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
    normalized === "color" ||
    normalized === "colour"
  ) {
    return "pa_color";
  }

  if (isSizeAttribute(attributeName)) {
    return "pa_size";
  }

  return `pa_${normalized}`;
}

/** Convert cart/UI size label to Woo `pa_size` slug (no Store API needed). */
export function cartSizeToWooAttributeSlug(size: string) {
  const formatted = formatSizeLabel(size.trim());
  if (/^W\d+\/L\d+$/i.test(formatted)) {
    return formatted.replace(/^W/i, "w").replace("/", "-").toLowerCase();
  }

  return stripSizeLocaleSuffix(formatted).toLowerCase();
}

/** Build GraphQL addToCart variation attrs from cart line (works in browser). */
export function buildAddToCartVariationAttributesFromCartLine(line: {
  size?: string;
  color?: string;
}) {
  const attributes: WooVariationAttributeInput[] = [];

  if (line.size && !isOneSizeLabel(line.size)) {
    attributes.push({
      attributeName: "pa_size",
      attributeValue: cartSizeToWooAttributeSlug(line.size),
    });
  }

  if (line.color) {
    attributes.push({
      attributeName: "pa_color",
      attributeValue: stripSizeLocaleSuffix(line.color).toLowerCase(),
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
    attributes.push({
      attributeName: "pa_size",
      attributeValue: resolveSizeAttributeSlug(line.size, product),
    });
  }

  if (line.color) {
    const colorAttr = product.attributes?.find((attribute) =>
      isColorAttribute(attribute.name),
    );
    const terms = colorAttr?.terms ?? [];
    const normalized = line.color.trim().toLowerCase();
    const match = terms.find(
      (term) =>
        term.slug.toLowerCase() === normalized ||
        term.name.toLowerCase() === normalized,
    );

    attributes.push({
      attributeName: colorAttr
        ? wooPaAttributeName(colorAttr.name)
        : "pa_color",
      attributeValue: match?.slug ?? normalized,
    });
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

      attributes.push({
        attributeName: wooPaAttributeName(attribute.name),
        attributeValue: value,
      });
    }
  }

  return attributes;
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
