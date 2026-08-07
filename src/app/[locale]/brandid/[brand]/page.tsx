import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateBrandCatalogMetadata,
  renderBrandCatalogPage,
} from "@/lib/shop/brand-catalog-page";
import {
  EQUIPMENT_BRAND_SLUGS,
  MOTORCYCLE_BRAND_SLUG_LIST,
} from "@/lib/shop/brand-catalog-url";

export const revalidate = 300;

export function generateStaticParams() {
  return [...MOTORCYCLE_BRAND_SLUG_LIST, ...EQUIPMENT_BRAND_SLUGS].map(
    (brand) => ({ brand }),
  );
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
