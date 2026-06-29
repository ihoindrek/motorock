import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fetchEquipmentCategoryIndex } from "@/lib/graphql/categories";
import { getEquipmentCatalogForRoute } from "@/lib/graphql/products";
import { resolveEquipmentRoute } from "@/lib/shop/equipment-route";

export const revalidate = 300;

type EquipmentCategoryPageProps = {
  params: Promise<{ locale: string; slug: string[] }>;
};

export async function generateMetadata({
  params,
}: EquipmentCategoryPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Category not found" };
  }

  const dictionary = getDictionary(localeParam);
  const index = await fetchEquipmentCategoryIndex(localeParam);
  const route = resolveEquipmentRoute(slug, index, localeParam, dictionary);

  if (!route) {
    return { title: "Category not found" };
  }

  return {
    title: route.title,
    description: route.description,
  };
}

export default async function EquipmentCategoryPage({
  params,
}: EquipmentCategoryPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const index = await fetchEquipmentCategoryIndex(localeParam);
  const route = resolveEquipmentRoute(slug, index, localeParam, dictionary);

  if (!route) {
    notFound();
  }

  const products = await getEquipmentCatalogForRoute(route, localeParam);

  return (
    <CategoryView
      key={slug.join("/")}
      route={route}
      products={products}
    />
  );
}
