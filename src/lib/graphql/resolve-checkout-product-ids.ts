import type { CartLine } from "@/context/cart-context";
import {
  findTranslationDatabaseId,
  getGraphqlLanguageCode,
} from "@/lib/graphql/wpml";
import { euUkSizesMatch } from "@/lib/shop/eu-uk-size";

/** WooCommerce checkout must use EN product IDs so cart totals match storefront prices. */
const CHECKOUT_PRICING_LOCALE = "en" as const;

export type CheckoutResolvableProduct = {
  databaseId: number;
  languageCode?: string | null;
  /** In-memory catalog nodes only — not queried in checkout GraphQL (WPML bug). */
  translations?: Array<{
    databaseId?: number | null;
    language?: { code?: string | null } | null;
  }> | null;
  __typename: "SimpleProduct" | "VariableProduct";
  variations?: {
    nodes: Array<{
      databaseId: number;
      attributes?: {
        nodes: Array<{ name: string; value: string }>;
      } | null;
    }>;
  } | null;
};

export async function fetchEnglishCheckoutProduct(
  product: CheckoutResolvableProduct,
  fetchById: (id: number) => Promise<CheckoutResolvableProduct | null>,
  fetchBySlug?: (slug: string) => Promise<CheckoutResolvableProduct | null>,
  slug?: string,
): Promise<CheckoutResolvableProduct> {
  if (getGraphqlLanguageCode(product) === CHECKOUT_PRICING_LOCALE) {
    return product;
  }

  const englishId = findTranslationDatabaseId(product, CHECKOUT_PRICING_LOCALE);
  if (englishId && englishId !== product.databaseId) {
    return (await fetchById(englishId)) ?? product;
  }

  if (slug && fetchBySlug) {
    return (await fetchBySlug(slug)) ?? product;
  }

  return product;
}

function variationIdOnProduct(
  product: CheckoutResolvableProduct,
  variationId?: number,
) {
  if (!variationId || product.__typename !== "VariableProduct") {
    return variationId;
  }

  const exists = product.variations?.nodes.some(
    (node) => node.databaseId === variationId,
  );

  return exists ? variationId : undefined;
}

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

function isLegLengthAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  return (
    normalized === "leg-length" ||
    normalized === "leg length" ||
    normalized === "jala pikkus"
  );
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

function findVariationForLine(
  product: CheckoutResolvableProduct,
  line: CartLine,
  isOneSizeLabel: (value?: string) => boolean,
  sizesMatch: (left: string, right: string) => boolean,
) {
  if (product.__typename === "SimpleProduct") {
    return undefined;
  }

  const nodes = product.variations?.nodes ?? [];
  if (nodes.length === 0) {
    return undefined;
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  const sizeIsGeneric = isOneSizeLabel(line.size);

  return nodes.find((node) => {
    const attributes = node.attributes?.nodes ?? [];
    const size = attributes.find((attribute) => isSizeAttribute(attribute.name));
    const color = attributes.find((attribute) => isColorAttribute(attribute.name));
    const leg = attributes.find((attribute) => isLegLengthAttribute(attribute.name));

    const sizeMatches =
      !sizeIsGeneric &&
      Boolean(line.size) &&
      Boolean(size) &&
      (sizesMatch(size!.value, line.size!) ||
        euUkSizesMatch(size!.value, line.size!));

    const colorMatches =
      Boolean(line.color) &&
      Boolean(color) &&
      (color!.value === line.color ||
        color!.value.toLowerCase() === line.color!.toLowerCase());

    const legMatches =
      !line.legLength?.trim() ||
      (Boolean(leg?.value) &&
        leg!.value.toLowerCase() === line.legLength!.trim().toLowerCase());

    if (sizeMatches && colorMatches && legMatches) {
      return true;
    }

    if (sizeMatches && !line.color && legMatches) {
      return true;
    }

    if (colorMatches && sizeIsGeneric && legMatches) {
      return true;
    }

    if (sizeIsGeneric && !line.color && !color && legMatches) {
      return true;
    }

    return false;
  });
}

export function resolveCheckoutProductIds(
  englishProduct: CheckoutResolvableProduct,
  line: CartLine,
  options: {
    isOneSizeLabel: (value?: string) => boolean;
    sizesMatch: (left: string, right: string) => boolean;
    variationId?: number;
  },
): {
  productId: number;
  variationId?: number;
} {
  if (englishProduct.__typename === "SimpleProduct") {
    return { productId: englishProduct.databaseId };
  }

  const variationId =
    variationIdOnProduct(englishProduct, options.variationId) ??
    findVariationForLine(
      englishProduct,
      line,
      options.isOneSizeLabel,
      options.sizesMatch,
    )?.databaseId;

  if (!variationId) {
    return { productId: englishProduct.databaseId };
  }

  return {
    productId: englishProduct.databaseId,
    variationId,
  };
}
