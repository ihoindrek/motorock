import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
import { EquipmentProductView } from "@/components/shop/equipment-product-view";
import { MotorcycleProductView } from "@/components/shop/motorcycle-product-view";
import { isLocale } from "@/i18n/config";
import {
  getCatalogProductsBySlugs,
  getMotorcycleCatalog,
  getMotorcycleProductBySlug,
  getProductBySlug,
  getProductSlugAlternates,
  getSimilarProducts,
} from "@/lib/graphql/products";
import { pickSimilarProducts } from "@/lib/shop/similar-products";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Product not found" };
  }

  const motorcycle = await getMotorcycleProductBySlug(slug, localeParam);
  const product = motorcycle
    ? undefined
    : await getProductBySlug(slug, localeParam);

  const name = motorcycle?.sync.name ?? product?.name;
  const description =
    motorcycle?.content.tagline ??
    motorcycle?.enrichment.tagline ??
    motorcycle?.sync.shortDescription ??
    product?.tagline;

  if (!name) {
    return { title: "Product not found" };
  }

  return {
    title: name,
    description: description || undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const motorcycle = await getMotorcycleProductBySlug(slug, localeParam);
  const slugAlternates = await getProductSlugAlternates(slug);

  if (motorcycle) {
    const motorcycleCatalog = await getMotorcycleCatalog(localeParam);
    const currentMotorcycle = motorcycleCatalog.find((item) => item.slug === slug);

    const relatedProducts = motorcycle.enrichment.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(
          motorcycle.enrichment.relatedSlugs,
          localeParam,
        )
      : currentMotorcycle
        ? pickSimilarProducts(currentMotorcycle, motorcycleCatalog)
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

  const product = await getProductBySlug(slug, localeParam);

  if (!product) {
    notFound();
  }

  const relatedProducts =
    product.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(product.relatedSlugs, localeParam)
      : await getSimilarProducts(product, 4, localeParam);

  return (
    <>
      <ProductLocaleAlternates alternates={slugAlternates} />
      <EquipmentProductView product={product} relatedProducts={relatedProducts} />
    </>
  );
}
