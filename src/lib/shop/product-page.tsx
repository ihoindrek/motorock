import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
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
import { buildPageMetadata } from "@/lib/seo/metadata";
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
    title: snapshot.name,
    description: snapshot.description,
    pathname: buildProductHref(slugAlternates[locale] ?? slug, locale),
    slugAlternates,
    slugPathTemplate: PRODUCT_SLUG_PATH_TEMPLATES,
  });

  const images = buildProductOpenGraphImages(snapshot);

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: snapshot.name,
      description: snapshot.description,
      images: images?.map((image) => image.url),
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

  const relatedProducts = (
    product.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(product.relatedSlugs, locale)
      : await getSimilarProducts(product, RELATED_PRODUCTS_LIMIT, locale)
  )
    .filter((candidate) => productsShareWcSubcategory(product, candidate))
    .slice(0, RELATED_PRODUCTS_LIMIT);

  return (
    <>
      <ProductJsonLd
        product={buildProductSeoSnapshotFromCatalog(product, locale)}
      />
      <ProductLocaleAlternates alternates={slugAlternates} />
      <EquipmentProductView product={product} relatedProducts={relatedProducts} />
    </>
  );
}

export function redirectLegacyProductPath(locale: Locale, slug: string): never {
  redirect(localizedHref(locale, buildProductHref(slug, locale)));
}
