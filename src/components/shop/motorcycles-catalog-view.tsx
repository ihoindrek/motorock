"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog-product";
import { CategoryView } from "@/components/shop/category-view";
import { motorcyclesCatalogRoute } from "@/lib/shop/category";

type MotorcyclesCatalogViewProps = {
  products: readonly CatalogProduct[];
};

export function MotorcyclesCatalogView({
  products,
}: MotorcyclesCatalogViewProps) {
  return (
    <CategoryView
      route={motorcyclesCatalogRoute}
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
