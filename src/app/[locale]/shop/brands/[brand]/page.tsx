import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getEquipmentCatalog } from "@/lib/graphql/products";

export const revalidate = 300;

const brandMap: Record<string, string> = {
  "pando-moto": "Pando Moto",
  holyfreedom: "Holyfreedom",
  "johnny-reb": "Johnny Reb",
  bobhead: "Bobhead",
  motogirl: "Motogirl",
};

type BrandPageProps = {
  params: Promise<{ locale: string; brand: string }>;
};

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandName = brandMap[brand];

  if (!brandName) {
    return { title: "Brand not found" };
  }

  return {
    title: brandName,
    description: `Shop ${brandName} riding gear at Motorock.eu`,
  };
}

export default async function BrandCategoryPage({ params }: BrandPageProps) {
  const { locale: localeParam, brand } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const brandName = brandMap[brand];

  if (!brandName) {
    notFound();
  }

  const products = await getEquipmentCatalog(localeParam);

  const route = {
    title: brandName,
    description: `Explore ${brandName} — premium riding gear and rebel essentials.`,
    breadcrumbs: [
      { label: "Home", href: localizedHref(localeParam, "/") },
      {
        label: "Driving Equipment",
        href: localizedHref(localeParam, "/shop/equipment"),
      },
      {
        label: brandName,
        href: localizedHref(localeParam, `/shop/brands/${brand}`),
      },
    ],
    brand: brandName,
  };

  return <CategoryView route={route} products={products} />;
}
