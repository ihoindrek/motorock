import { isLocale, type Locale } from "@/i18n/config";
import {
  isGraphqlMotorcycle,
  mapGraphqlToCatalogProduct,
  mapGraphqlToMotorcycleProduct,
} from "@/lib/graphql/map-graphql-product";
import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";
import { collectProductWcCategorySlugs } from "@/lib/shop/wc-categories";
import type { GraphQLMetaData, GraphQLProduct } from "@/lib/graphql/types";
import { getGraphqlLanguageCode } from "@/lib/graphql/wpml";
import { AI_PRODUCT_META_KEYS } from "@/lib/ai/domain/content-section";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

function readMetaValue(meta: GraphQLMetaData[] | null | undefined, key: string) {
  return meta?.find((entry) => entry.key === key)?.value ?? undefined;
}

function parseKeywords(raw: string | undefined) {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return undefined;
  }
}

function detectImportSource(meta: GraphQLMetaData[] | null | undefined) {
  if (
    readMetaValue(meta, "_import_source") === "shopify" ||
    readMetaValue(meta, "_shopify_product_id")
  ) {
    return "shopify" as const;
  }

  return "unknown" as const;
}

function mapAttributes(product: GraphQLProduct) {
  return (product.attributes?.nodes ?? []).map((attribute) => ({
    name: attribute.name,
    slug: attribute.name.toLowerCase().replace(/^pa_/, "").replace(/\s+/g, "-"),
    values: attribute.terms?.nodes?.length
      ? attribute.terms.nodes.map((term) => term.name)
      : (attribute.options ?? []).filter(Boolean),
    isVariation: Boolean(attribute.variation),
  }));
}

function mapVariations(product: GraphQLProduct) {
  if (product.__typename !== "VariableProduct") {
    return [];
  }

  return (product.variations?.nodes ?? []).map((variation) => {
    const attributes = Object.fromEntries(
      (variation.attributes?.nodes ?? []).map((entry) => [entry.name, entry.value]),
    );

    return {
      sku: variation.sku ?? undefined,
      attributes,
      price: parseGraphqlPrice(variation.price ?? variation.regularPrice),
      inStock: variation.stockStatus === "IN_STOCK",
    };
  });
}

function mapTranslations(product: GraphQLProduct) {
  const translations = new Map<string, NormalizedProduct["translations"][number]>();

  const primaryLanguage = getGraphqlLanguageCode(product);
  if (primaryLanguage && isLocale(primaryLanguage)) {
    translations.set(primaryLanguage, {
      productId: product.databaseId,
      locale: primaryLanguage,
      slug: product.slug,
    });
  }

  for (const entry of product.translations ?? []) {
    const localeCode = entry.language?.code?.toLowerCase();
    if (!isLocale(localeCode) || !entry.databaseId) {
      continue;
    }

    translations.set(localeCode, {
      productId: entry.databaseId,
      locale: localeCode,
      slug: entry.slug ?? product.slug,
    });
  }

  return [...translations.values()];
}

export function toNormalizedProduct(
  product: GraphQLProduct,
  locale: Locale,
): NormalizedProduct {
  const isMotorcycle = isGraphqlMotorcycle(product);
  const categoryPath = collectProductWcCategorySlugs(
    product.productCategories?.nodes ?? [],
  );

  let name: string;
  let brand: string | undefined;
  let price: number;
  let inStock: boolean;
  let category: NormalizedProduct["category"];

  if (isMotorcycle) {
    const mapped = mapGraphqlToMotorcycleProduct(product, locale);
    name = mapped.sync.name;
    brand = mapped.sync.brand || undefined;
    price = mapped.sync.price;
    inStock = mapped.sync.inStock;
    category = "motorcycles";
  } else {
    const mapped = mapGraphqlToCatalogProduct(product, locale);
    name = mapped.name;
    brand = mapped.brand || undefined;
    price = mapped.price;
    inStock = mapped.inStock;
    category = mapped.category;
  }

  const images = [
    ...(product.image?.sourceUrl
      ? [{ url: product.image.sourceUrl, altText: product.image.altText ?? undefined }]
      : []),
    ...(product.galleryImages?.nodes ?? []).map((image) => ({
      url: image.sourceUrl,
      altText: image.altText ?? undefined,
    })),
  ];

  return {
    productId: product.databaseId,
    locale,
    slug: product.slug,
    sku: product.sku ?? undefined,
    name,
    brand: brand || undefined,
    productType: isMotorcycle ? "motorcycle" : "equipment",
    category,
    categoryPath: [...categoryPath],
    price,
    currency: "EUR",
    inStock,
    attributes: mapAttributes(product),
    variations: mapVariations(product),
    images,
    existing: {
      shortDescription: product.shortDescription ?? undefined,
      description: product.description ?? undefined,
      seoTitle: readMetaValue(product.metaData, AI_PRODUCT_META_KEYS.seoTitle),
      seoMetaDescription: readMetaValue(
        product.metaData,
        AI_PRODUCT_META_KEYS.seoMetaDescription,
      ),
      seoKeywords: parseKeywords(
        readMetaValue(product.metaData, AI_PRODUCT_META_KEYS.seoKeywords),
      ),
    },
    translations: mapTranslations(product),
    source: detectImportSource(product.metaData),
    modifiedAt: product.modified ?? product.date ?? undefined,
  };
}
