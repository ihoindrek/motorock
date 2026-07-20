import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { EquipmentProductView } from "@/components/shop/equipment-product-view";
import { MotorcycleProductView } from "@/components/shop/motorcycle-product-view";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import {
  getCatalogProductsBySlugs,
  getMotorcycleCatalog,
  getMotorcycleProductBySlug,
  getProductBySlug,
  getProductSlugAlternates,
  getSimilarProducts,
} from "@/lib/graphql/products";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ProductSchemaShipping } from "@/lib/seo/product-schema";
import { buildBreadcrumbJsonLd } from "@/lib/seo/site-schema";
import { estimateProductShipping } from "@/lib/shop/estimate-product-shipping";
import { getStorefrontUrl } from "@/lib/storefront/url";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  buildProductOpenGraphImages,
  buildProductSeoSnapshotFromCatalog,
  buildProductSeoSnapshotFromMotorcycle,
} from "@/lib/seo/product-metadata";
import {
  buildProductHref,
  localizedProductHref,
  PRODUCT_PATH_SEGMENTS,
  PRODUCT_SLUG_PATH_TEMPLATES,
} from "@/lib/shop/product-url";
import { pickSimilarProducts, RELATED_PRODUCTS_LIMIT } from "@/lib/shop/similar-products";
import { productsShareWcSubcategory } from "@/lib/shop/wc-categories";
import { getRequestCountry } from "@/lib/geo/request-country";

type ProductPageParams = {
  locale: Locale;
  slug: string;
  pathSegment: string;
};

function buildProductPageMetadataFromSnapshot(
  locale: Locale,
  slug: string,
  slugAlternates: Awaited<ReturnType<typeof getProductSlugAlternates>>,
  snapshot: ReturnType<typeof buildProductSeoSnapshotFromMotorcycle>,
): Metadata {
  const base = buildPageMetadata({
    locale,
    title: snapshot.seoTitle,
    description: snapshot.seoDescription,
    pathname: buildProductHref(slugAlternates[locale] ?? slug, locale),
    slugAlternates,
    slugPathTemplate: PRODUCT_SLUG_PATH_TEMPLATES,
  });

  const images = buildProductOpenGraphImages(snapshot);

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: snapshot.seoTitle,
      description: snapshot.seoDescription,
      ...(images ? { images: images.map((image) => image.url) } : {}),
    },
  };
}

export async function generateProductPageMetadata({
  locale,
  slug,
}: Omit<ProductPageParams, "pathSegment">): Promise<Metadata> {
  const slugAlternates = await getProductSlugAlternates(slug);
  const motorcycle = await getMotorcycleProductBySlug(slug, locale);

  if (motorcycle) {
    return buildProductPageMetadataFromSnapshot(
      locale,
      slug,
      slugAlternates,
      buildProductSeoSnapshotFromMotorcycle(motorcycle, locale),
    );
  }

  const product = await getProductBySlug(slug, locale);

  if (!product) {
    return { title: "Product not found" };
  }

  return buildProductPageMetadataFromSnapshot(
    locale,
    slug,
    slugAlternates,
    buildProductSeoSnapshotFromCatalog(product, locale),
  );
}

const SCHEMA_SHIPPING_TIMEOUT_MS = 4000;

/**
 * Cheapest EE delivery rate for JSON-LD shippingDetails. Best-effort: the
 * estimate needs a Woo cart session, so failures/slowness just omit the field.
 */
async function resolveSchemaShipping(
  product: CatalogProduct,
): Promise<ProductSchemaShipping | undefined> {
  if (!product.databaseId || !product.inStock) {
    return undefined;
  }

  const variationId =
    product.variations?.find((variation) => variation.databaseId)?.databaseId ??
    Object.values(product.variationIds ?? {})[0];

  try {
    const estimate = await Promise.race([
      estimateProductShipping({
        country: "EE",
        productId: product.databaseId,
        variationId,
      }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SCHEMA_SHIPPING_TIMEOUT_MS),
      ),
    ]);

    if (!estimate || estimate.cost === null) {
      return undefined;
    }

    return { cost: estimate.cost, country: estimate.country };
  } catch {
    return undefined;
  }
}

function buildProductBreadcrumbJsonLd(
  locale: Locale,
  product: { name: string; backHref: string; backLabel: string },
) {
  const base = getStorefrontUrl();
  const dict = getDictionary(locale);

  return buildBreadcrumbJsonLd([
    {
      name: dict.pdp.breadcrumbHome,
      url: `${base}${localizedHref(locale, "/")}`,
    },
    {
      name: product.backLabel,
      url: `${base}${localizedHref(locale, product.backHref)}`,
    },
    { name: product.name },
  ]);
}

export async function renderProductPage({
  locale,
  slug,
  pathSegment,
}: ProductPageParams) {
  const slugAlternates = await getProductSlugAlternates(slug);
  const canonicalSlug = slugAlternates[locale] ?? slug;
  const canonicalSegment = PRODUCT_PATH_SEGMENTS[locale];

  if (pathSegment !== canonicalSegment || slug !== canonicalSlug) {
    redirect(localizedProductHref(canonicalSlug, locale));
  }

  const motorcycle = await getMotorcycleProductBySlug(slug, locale);

  if (motorcycle) {
    const motorcycleCatalog = await getMotorcycleCatalog(locale);
    const currentMotorcycle = motorcycleCatalog.find((item) => item.slug === slug);

    const relatedProducts = motorcycle.enrichment.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(
          motorcycle.enrichment.relatedSlugs,
          locale,
        )
      : currentMotorcycle
        ? pickSimilarProducts(currentMotorcycle, motorcycleCatalog, RELATED_PRODUCTS_LIMIT)
        : [];

    return (
      <>
        <ProductJsonLd
          product={buildProductSeoSnapshotFromMotorcycle(motorcycle, locale)}
        />
        <JsonLd
          schema={buildProductBreadcrumbJsonLd(locale, {
            name: motorcycle.sync.name,
            backHref: motorcycle.backHref,
            backLabel: motorcycle.backLabel,
          })}
        />
        <ProductLocaleAlternates alternates={slugAlternates} />
        <MotorcycleProductView
          product={motorcycle}
          relatedProducts={relatedProducts}
        />
      </>
    );
  }

  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const [defaultShippingCountry, schemaShipping, relatedCandidates] =
    await Promise.all([
      getRequestCountry("EE"),
      resolveSchemaShipping(product),
      product.relatedSlugs?.length
        ? getCatalogProductsBySlugs(product.relatedSlugs, locale)
        : getSimilarProducts(product, RELATED_PRODUCTS_LIMIT, locale),
    ]);

  const relatedProducts = relatedCandidates
    .filter((candidate) => productsShareWcSubcategory(product, candidate))
    .slice(0, RELATED_PRODUCTS_LIMIT);

  return (
    <>
      <ProductJsonLd
        product={buildProductSeoSnapshotFromCatalog(product, locale)}
        shipping={schemaShipping}
      />
      <JsonLd schema={buildProductBreadcrumbJsonLd(locale, product)} />
      <ProductLocaleAlternates alternates={slugAlternates} />
      <EquipmentProductView
        product={product}
        relatedProducts={relatedProducts}
        defaultShippingCountry={defaultShippingCountry}
      />
    </>
  );
}

export function redirectLegacyProductPath(locale: Locale, slug: string): never {
  redirect(localizedHref(locale, buildProductHref(slug, locale)));
}
