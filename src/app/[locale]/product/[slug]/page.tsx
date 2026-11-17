import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  getMotorcycleProductBySlug,
  getProductBySlug,
} from "@/lib/graphql/products";
import {
  generateProductPageMetadata,
  renderProductPage,
} from "@/lib/shop/product-page";

export const revalidate = 1800;

// No build-time prerender (empty list), but having generateStaticParams
// opts the route into ISR so visited products get cached on demand.
export function generateStaticParams() {
  return [];
}

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  return generateProductPageMetadata({ locale: localeParam, slug });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  // Call notFound in the route module (same pattern as blog) so Next sets HTTP 404.
  const [motorcycle, product] = await Promise.all([
    getMotorcycleProductBySlug(slug, localeParam),
    getProductBySlug(slug, localeParam),
  ]);
  if (!motorcycle && !product) {
    notFound();
  }

  return renderProductPage({
    locale: localeParam,
    slug,
    pathSegment: "product",
  });
}
