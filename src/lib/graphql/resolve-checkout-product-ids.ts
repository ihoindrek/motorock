import type { CartLine } from "@/context/cart-context";
import {
  findTranslationDatabaseId,
  getGraphqlLanguageCode,
} from "@/lib/graphql/wpml";

/** WooCommerce checkout must use EN product IDs so cart totals match storefront prices. */
const CHECKOUT_PRICING_LOCALE = "en" as const;

export type CheckoutResolvableProduct = {
  databaseId: number;
  languageCode?: string | null;
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
): Promise<CheckoutResolvableProduct> {
  if (getGraphqlLanguageCode(product) === CHECKOUT_PRICING_LOCALE) {
    return product;
  }

  const englishId = findTranslationDatabaseId(product, CHECKOUT_PRICING_LOCALE);
  if (!englishId || englishId === product.databaseId) {
    return product;
  }

  return (await fetchById(englishId)) ?? product;
}

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

    const sizeMatches =
      !sizeIsGeneric &&
      Boolean(line.size) &&
      Boolean(size) &&
      sizesMatch(size!.value, line.size!);

    const colorMatches =
      Boolean(line.color) &&
      Boolean(color) &&
      (color!.value === line.color ||
        color!.value.toLowerCase() === line.color!.toLowerCase());

    if (sizeMatches && colorMatches) {
      return true;
    }

    if (sizeMatches && !line.color) {
      return true;
    }

    if (colorMatches && sizeIsGeneric) {
      return true;
    }

    if (sizeIsGeneric && !line.color && !color) {
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
    options.variationId ??
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
