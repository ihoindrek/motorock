import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateBrandCatalogMetadata,
  renderBrandCatalogPage,
} from "@/lib/shop/brand-catalog-page";

export const revalidate = 300;

// No build-time prerender (empty list), but having generateStaticParams
// opts the route into ISR so visited paths get cached on demand.
export function generateStaticParams() {
  return [];
}


type BrandidPageProps = {
  params: Promise<{ locale: string; brand: string }>;
};

export async function generateMetadata({
  params,
}: BrandidPageProps): Promise<Metadata> {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Brand not found" };
  }

  return generateBrandCatalogMetadata({ locale: localeParam, brand });
}

export default async function BrandidCategoryPage({ params }: BrandidPageProps) {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return renderBrandCatalogPage({
    locale: localeParam,
    brand,
    routeTree: "et",
  });
}
