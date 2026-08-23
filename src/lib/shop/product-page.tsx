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
  getMotorcycleProductBySlug,
  getProductBySlug,
  getProductSlugAlternates,
  getSimilarProducts,
} from "@/lib/graphql/products";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/site-schema";
import { fetchEquipmentCategoryIndex } from "@/lib/graphql/categories";
import type { Breadcrumb } from "@/lib/shop/category";
import { resolveProductBreadcrumbs } from "@/lib/shop/resolve-product-breadcrumbs";
import { getSizeGuideRegistry } from "@/lib/shop/fetch-size-guides";
import { resolveSizeGuide } from "@/lib/shop/resolve-size-guide";
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
import {
  buildMotorcycleSimilarAnchor,
  RELATED_PRODUCTS_LIMIT,
} from "@/lib/shop/similar-products";
import { productsShareWcSubcategory } from "@/lib/shop/wc-categories";

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
  const [slugAlternates, motorcycle] = await Promise.all([
    getProductSlugAlternates(slug),
    getMotorcycleProductBySlug(slug, locale),
  ]);

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

function buildProductBreadcrumbJsonLd(
  locale: Locale,
  product: { name: string; breadcrumbs: readonly Breadcrumb[] },
) {
  const base = getStorefrontUrl();

  return buildBreadcrumbJsonLd([
    ...product.breadcrumbs.map((crumb) => ({
      name: crumb.label,
      url: `${base}${localizedHref(locale, crumb.href)}`,
    })),
    { name: product.name },
  ]);
}

export async function renderProductPage({
  locale,
  slug,
  pathSegment,
}: ProductPageParams) {
  // The three lookups share the same underlying (deduped) product fetch, so
  // running them in parallel avoids a waterfall on uncached renders.
  const [slugAlternates, motorcycle] = await Promise.all([
    getProductSlugAlternates(slug),
    getMotorcycleProductBySlug(slug, locale),
  ]);
  const canonicalSlug = slugAlternates[locale] ?? slug;
  const canonicalSegment = PRODUCT_PATH_SEGMENTS[locale];

  if (pathSegment !== canonicalSegment || slug !== canonicalSlug) {
    redirect(localizedProductHref(canonicalSlug, locale));
  }

  if (motorcycle) {
    const dict = getDictionary(locale);
    const breadcrumbs = resolveProductBreadcrumbs(
      {
        type: "motorcycle",
        category: "motorcycles",
        brand: motorcycle.sync.brand,
        backHref: motorcycle.backHref,
        backLabel: motorcycle.backLabel,
      },
      locale,
      dict,
      null,
    );

    const relatedProducts = motorcycle.enrichment.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(
          motorcycle.enrichment.relatedSlugs,
          locale,
        )
      : await getSimilarProducts(
          buildMotorcycleSimilarAnchor(motorcycle),
          RELATED_PRODUCTS_LIMIT,
          locale,
        );

    return (
      <>
        <ProductJsonLd
          product={buildProductSeoSnapshotFromMotorcycle(motorcycle, locale)}
          faq={motorcycle.faq}
        />
        <JsonLd
          schema={buildProductBreadcrumbJsonLd(locale, {
            name: motorcycle.sync.name,
            breadcrumbs,
          })}
        />
        <ProductLocaleAlternates alternates={slugAlternates} />
        <MotorcycleProductView
          product={motorcycle}
          breadcrumbs={breadcrumbs}
          relatedProducts={relatedProducts}
        />
      </>
    );
  }

  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const dict = getDictionary(locale);
  const categoryIndex = await fetchEquipmentCategoryIndex(locale);
  const breadcrumbs = resolveProductBreadcrumbs(
    product,
    locale,
    dict,
    categoryIndex,
  );

  const [relatedCandidates, sizeGuideRegistry] = await Promise.all([
    product.relatedSlugs?.length
      ? getCatalogProductsBySlugs(product.relatedSlugs, locale)
      : getSimilarProducts(product, RELATED_PRODUCTS_LIMIT, locale),
    getSizeGuideRegistry(),
  ]);

  const relatedProducts = relatedCandidates
    .filter((candidate) => productsShareWcSubcategory(product, candidate))
    .slice(0, RELATED_PRODUCTS_LIMIT);

  const sizeGuide = resolveSizeGuide(product, sizeGuideRegistry);

  return (
    <>
      <ProductJsonLd
        product={buildProductSeoSnapshotFromCatalog(product, locale)}
        faq={product.faq}
      />
      <JsonLd
        schema={buildProductBreadcrumbJsonLd(locale, {
          name: product.name,
          breadcrumbs,
        })}
      />
      <ProductLocaleAlternates alternates={slugAlternates} />
      <EquipmentProductView
        product={product}
        breadcrumbs={breadcrumbs}
        metaCatalog={
          product.metaCatalogProductId && product.metaCatalogVariationIds
            ? {
                productId: product.metaCatalogProductId,
                variationIds: product.metaCatalogVariationIds,
              }
            : undefined
        }
        relatedProducts={relatedProducts}
        sizeGuide={sizeGuide}
      />
    </>
  );
}

export function redirectLegacyProductPath(locale: Locale, slug: string): never {
  redirect(localizedHref(locale, buildProductHref(slug, locale)));
}
