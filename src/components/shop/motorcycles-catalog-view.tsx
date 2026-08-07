"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { useDictionary, useLocale } from "@/context/locale-context";
import { CategoryView } from "@/components/shop/category-view";
import { buildMotorcyclesCatalogRoute } from "@/lib/shop/category";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { getMotorcycleBrandFilterNames } from "@/lib/shop/resolve-product-brand";

type MotorcyclesCatalogViewProps = {
  products: readonly CatalogProduct[];
};

export function MotorcyclesCatalogView({
  products,
}: MotorcyclesCatalogViewProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const motorcycleBrandNames = useMemo(() => getMotorcycleBrandFilterNames(), []);
  const route = useMemo(
    () => buildMotorcyclesCatalogRoute(dict, undefined, locale),
    [dict, locale],
  );

  return (
    <CategoryView
      route={route}
      products={products}
      availableBrands={motorcycleBrandNames}
      motoBackground
      showSizeFilter={false}
      brandFilterVariant="logos"
      pageSize={12}
      gridColumns={3}
      gridDividers
      footer={
        <p className="text-sm text-ink/60">
          {dict.catalog.lookingForGear}{" "}
          <Link
            href={localizedHref(locale, buildEquipmentHubHref(locale))}
            className="text-accent hover:underline"
          >
            {dict.catalog.shopEquipmentCta}
          </Link>
        </p>
      }
    />
  );
}
