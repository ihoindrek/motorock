"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { useDictionary, useLocale } from "@/context/locale-context";
import { CategoryView } from "@/components/shop/category-view";
import { buildMotorcyclesCatalogRoute } from "@/lib/shop/category";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { resolveMotorcycleBrandFromSlug } from "@/lib/shop/brand-catalog-url";

type MotorcyclesCatalogViewProps = {
  products: readonly CatalogProduct[];
};

export function MotorcyclesCatalogView({
  products,
}: MotorcyclesCatalogViewProps) {
  const locale = useLocale();
  const dict = useDictionary();
  // ?brand= is resolved after mount so the page can be statically
  // prerendered without server-side searchParams access.
  const [brand, setBrand] = useState<string | undefined>(undefined);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("brand");
    if (!slug) {
      return;
    }

    const brandNames = [...new Set(products.map((product) => product.brand))];
    setBrand(resolveMotorcycleBrandFromSlug(slug, brandNames));
  }, [products]);

  const route = useMemo(
    () => buildMotorcyclesCatalogRoute(dict, brand),
    [brand, dict],
  );

  return (
    <CategoryView
      key={brand ?? "all"}
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
