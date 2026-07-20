import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  fetchEquipmentCategoryIndex,
  findCategoryByPathSlug,
  getLocalizedCategorySlug,
  plainTextFromHtml,
} from "@/lib/graphql/categories";
import { getEquipmentCatalogForRoute } from "@/lib/graphql/products";
import {
  buildShopCategoryHref,
  isStandaloneShopCategory,
  resolveShopCategoryRoute,
} from "@/lib/shop/shop-category-route";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type ShopCategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: ShopCategoryPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Category not found" };
  }

  const dict = getDictionary(localeParam);
  const index = await fetchEquipmentCategoryIndex(localeParam);
  const node = index ? findCategoryByPathSlug(index, slug, localeParam) : null;

  if (!node || !index || !isStandaloneShopCategory(node, index)) {
    return { title: "Category not found" };
  }

  const route = resolveShopCategoryRoute(node, localeParam, dict);

  return buildPageMetadata({
    locale: localeParam,
    title: route.title,
    description: plainTextFromHtml(route.description) || undefined,
    pathname: buildShopCategoryHref(node, localeParam),
  });
}

export default async function ShopCategoryPage({ params }: ShopCategoryPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);
  const index = await fetchEquipmentCategoryIndex(localeParam);
  const node = index ? findCategoryByPathSlug(index, slug, localeParam) : null;

  if (!node || !index || !isStandaloneShopCategory(node, index)) {
    notFound();
  }

  const canonicalSlug = getLocalizedCategorySlug(node, localeParam);

  if (slug !== canonicalSlug) {
    redirect(localizedHref(localeParam, buildShopCategoryHref(node, localeParam)));
  }

  const route = resolveShopCategoryRoute(node, localeParam, dict);
  const products = await getEquipmentCatalogForRoute(route, localeParam);

  return (
    <CategoryView
      key={`${localeParam}-${canonicalSlug}`}
      route={route}
      products={products}
    />
  );
}
