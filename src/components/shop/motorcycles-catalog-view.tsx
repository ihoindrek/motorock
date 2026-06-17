"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog-product";
import { CategoryView } from "@/components/shop/category-view";
import { motorcyclesCatalogRoute } from "@/lib/shop/category";

type MotorcyclesCatalogViewProps = {
  products: readonly CatalogProduct[];
  initialBrand?: string;
};

export function MotorcyclesCatalogView({
  products,
  initialBrand,
}: MotorcyclesCatalogViewProps) {
  const route = initialBrand
    ? {
        ...motorcyclesCatalogRoute,
        brand: initialBrand,
        title: `${initialBrand} motorcycles`,
        description: `Explore ${initialBrand} motorcycles at Motorock — premium machines for riders who refuse to blend in.`,
        breadcrumbs: [
          ...motorcyclesCatalogRoute.breadcrumbs,
          {
            label: initialBrand,
            href: `/shop/motorcycles?brand=${initialBrand.toLowerCase().replace(/\s+/g, "-")}`,
          },
        ],
      }
    : motorcyclesCatalogRoute;

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
      sectionBackgroundHeading
      footer={
        <p className="text-sm text-ink/60">
          Looking for gear?{" "}
          <Link href="/shop/equipment" className="text-accent hover:underline">
            Shop driving equipment →
          </Link>
        </p>
      }
    />
  );
}
