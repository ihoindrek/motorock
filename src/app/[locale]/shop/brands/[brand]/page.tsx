import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { generateBrandCatalogMetadata } from "@/lib/shop/brand-catalog-page";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";

export const revalidate = 300;

// No build-time prerender (empty list), but having generateStaticParams
// opts the route into ISR so visited paths get cached on demand.
export function generateStaticParams() {
  return [];
}


type LegacyBrandPageProps = {
  params: Promise<{ locale: string; brand: string }>;
};

export async function generateMetadata({
  params,
}: LegacyBrandPageProps): Promise<Metadata> {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Brand not found" };
  }

  return generateBrandCatalogMetadata({ locale: localeParam, brand });
}

export default async function LegacyBrandCategoryPage({
  params,
}: LegacyBrandPageProps) {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  redirect(localizedHref(localeParam, buildBrandCatalogHref(localeParam, brand)));
}
