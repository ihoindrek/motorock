import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getDictionary } from "@/i18n/get-dictionary";
import { getEquipmentCatalog } from "@/lib/graphql/products";
import {
  buildBrandCatalogHref,
  buildEquipmentBrandRoute,
  resolveEquipmentBrandName,
} from "@/lib/shop/brand-catalog-url";
import {
  brandRouteTreeForLocale,
  type BrandRouteTree,
} from "@/lib/shop/brand-url";
import { buildPageMetadata } from "@/lib/seo/metadata";

type BrandCatalogPageArgs = {
  locale: Locale;
  brand: string;
  routeTree: BrandRouteTree;
};

export async function generateBrandCatalogMetadata({
  locale,
  brand,
}: Pick<BrandCatalogPageArgs, "locale" | "brand">): Promise<Metadata> {
  const brandName = resolveEquipmentBrandName(brand);

  if (!brandName) {
    return { title: "Brand not found" };
  }

  const dict = getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: brandName,
    description: dict.seo.brandDescription.replace("{brand}", brandName),
    pathname: buildBrandCatalogHref(locale, brand),
  });
}

export async function renderBrandCatalogPage({
  locale,
  brand,
  routeTree,
}: BrandCatalogPageArgs) {
  if (brandRouteTreeForLocale(locale) !== routeTree) {
    if (resolveEquipmentBrandName(brand)) {
      redirect(localizedHref(locale, buildBrandCatalogHref(locale, brand)));
    }

    notFound();
  }

  const dict = getDictionary(locale);
  const route = buildEquipmentBrandRoute(locale, brand, dict);

  if (!route) {
    notFound();
  }

  const products = await getEquipmentCatalog(locale);

  return <CategoryView route={route} products={products} />;
}
