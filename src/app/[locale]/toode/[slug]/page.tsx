import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateProductPageMetadata,
  renderProductPage,
} from "@/lib/shop/product-page";

export const revalidate = 300;

// No build-time prerender (empty list), but having generateStaticParams
// opts the route into ISR so visited paths get cached on demand.
export function generateStaticParams() {
  return [];
}


type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Product not found" };
  }

  return generateProductPageMetadata({ locale: localeParam, slug });
}

export default async function ToodeProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return renderProductPage({
    locale: localeParam,
    slug,
    pathSegment: "toode",
  });
}
