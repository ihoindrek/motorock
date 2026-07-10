import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateBrandCatalogMetadata,
  renderBrandCatalogPage,
} from "@/lib/shop/brand-catalog-page";

export const revalidate = 300;

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
