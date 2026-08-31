import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getDictionary } from "@/i18n/get-dictionary";
import { getEquipmentCatalogForRoute, getMotorcycleCatalog } from "@/lib/graphql/products";
import {
  buildBrandCatalogHref,
  buildEquipmentBrandRoute,
  buildMotorcycleBrandRoute,
  resolveBrandNameFromSlug,
  resolveEquipmentBrandName,
} from "@/lib/shop/brand-catalog-url";
import { isMotorcycleBrandSlug } from "@/lib/shop/resolve-product-brand";
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
  const brandName = resolveBrandNameFromSlug(brand);

  if (!brandName) {
    return { title: "Brand not found" };
  }

  const dict = getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: isMotorcycleBrandSlug(brand)
      ? dict.catalog.brandMotorcyclesTitle.replace("{brand}", brandName)
      : brandName,
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
    if (resolveBrandNameFromSlug(brand)) {
      redirect(localizedHref(locale, buildBrandCatalogHref(locale, brand)));
    }

    notFound();
  }

  const dict = getDictionary(locale);

  if (isMotorcycleBrandSlug(brand)) {
    const route = buildMotorcycleBrandRoute(locale, brand, dict);

    if (!route) {
      notFound();
    }

    const products = await getMotorcycleCatalog(locale);

    return (
      <CategoryView
        route={route}
        products={products}
        motoBackground
        showSizeFilter={false}
        brandFilterVariant="logos"
        pageSize={12}
        gridColumns={3}
        gridDividers
      />
    );
  }

  if (resolveEquipmentBrandName(brand)) {
    const route = buildEquipmentBrandRoute(locale, brand, dict);

    if (!route) {
      notFound();
    }

    const products = await getEquipmentCatalogForRoute(route, locale);

    return <CategoryView route={route} products={products} />;
  }

  notFound();
}
