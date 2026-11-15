import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateBrandCatalogMetadata,
  renderBrandCatalogPage,
} from "@/lib/shop/brand-catalog-page";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/revalidate/cache-policy";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

// No build-time prerender (empty list), but having generateStaticParams
// opts the route into ISR so visited brand pages get cached on demand.
export function generateStaticParams() {
  return [];
}


type BrandPageProps = {
  params: Promise<{ locale: string; brand: string }>;
};

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Brand not found" };
  }

  return generateBrandCatalogMetadata({ locale: localeParam, brand });
}

export default async function BrandCategoryPage({ params }: BrandPageProps) {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return renderBrandCatalogPage({
    locale: localeParam,
    brand,
    routeTree: "en",
  });
}
