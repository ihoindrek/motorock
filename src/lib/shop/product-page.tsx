import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
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

export async function generateProductPageMetadata({
  locale,
  slug,
}: Omit<ProductPageParams, "pathSegment">): Promise<Metadata> {
  const motorcycle = await getMotorcycleProductBySlug(slug, locale);
  const product = motorcycle ? undefined : await getProductBySlug(slug, locale);

  const name = motorcycle?.sync.name ?? product?.name;
  const description =
    motorcycle?.content.tagline ??
    motorcycle?.enrichment.tagline ??
    motorcycle?.sync.shortDescription ??
    product?.tagline;

  if (!name) {
    return { title: "Product not found" };
  }

  const slugAlternates = await getProductSlugAlternates(slug);

  return buildPageMetadata({
    locale,
    title: name,
    description: description || undefined,
    pathname: buildProductHref(slugAlternates[locale] ?? slug, locale),
    slugAlternates,
    slugPathTemplate: PRODUCT_SLUG_PATH_TEMPLATES,
  });
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
      <ProductLocaleAlternates alternates={slugAlternates} />
      <EquipmentProductView product={product} relatedProducts={relatedProducts} />
    </>
  );
}

export function redirectLegacyProductPath(locale: Locale, slug: string): never {
  redirect(localizedHref(locale, buildProductHref(slug, locale)));
}
