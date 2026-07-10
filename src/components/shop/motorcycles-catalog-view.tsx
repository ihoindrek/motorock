"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog-product";
import { useDictionary, useLocale } from "@/context/locale-context";
import { CategoryView } from "@/components/shop/category-view";
import { buildMotorcyclesCatalogRoute } from "@/lib/shop/category";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

type MotorcyclesCatalogViewProps = {
  products: readonly CatalogProduct[];
  initialBrand?: string;
};

export function MotorcyclesCatalogView({
  products,
  initialBrand,
}: MotorcyclesCatalogViewProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const route = buildMotorcyclesCatalogRoute(dict, initialBrand);

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
