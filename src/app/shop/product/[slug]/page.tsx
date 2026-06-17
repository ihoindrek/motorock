import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EquipmentProductView } from "@/components/shop/equipment-product-view";
import { MotorcycleProductView } from "@/components/shop/motorcycle-product-view";
import {
  getCatalogProductsBySlugs,
  getMotorcycleCatalog,
  getMotorcycleProductBySlug,
  getProductBySlug,
  getSimilarProducts,
} from "@/lib/graphql/products";
import { pickSimilarProducts } from "@/lib/shop/similar-products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const motorcycle = await getMotorcycleProductBySlug(slug);
  const product = motorcycle
    ? undefined
    : await getProductBySlug(slug);

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
  const { slug } = await params;
  const motorcycle = await getMotorcycleProductBySlug(slug);

  if (motorcycle) {
    const motorcycleCatalog = await getMotorcycleCatalog();
    const currentMotorcycle = motorcycleCatalog.find((item) => item.slug === slug);

    const relatedProducts = motorcycle.enrichment.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(motorcycle.enrichment.relatedSlugs)
      : currentMotorcycle
        ? pickSimilarProducts(currentMotorcycle, motorcycleCatalog)
        : [];

    return (
      <MotorcycleProductView
        product={motorcycle}
        relatedProducts={relatedProducts}
      />
    );
  }

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts =
    product.relatedSlugs?.length
      ? await getCatalogProductsBySlugs(product.relatedSlugs)
      : await getSimilarProducts(product);

  return (
    <EquipmentProductView product={product} relatedProducts={relatedProducts} />
  );
}
