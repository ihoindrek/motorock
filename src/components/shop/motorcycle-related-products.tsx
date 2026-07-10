"use client";

import { useMemo } from "react";
import { useDictionary } from "@/context/locale-context";
import type { CatalogProduct } from "@/types/catalog-product";
import { RidersFavoritesCarousel } from "@/components/riders-favorites-carousel";
import { catalogToFavoriteProduct } from "@/lib/shop/favorite-product";
import { cn } from "@/lib/utils";

type MotorcycleRelatedProductsProps = {
  products: readonly CatalogProduct[];
  /** Room for fixed mobile CTA bar — padding stays on moto background. */
  reserveMobileCtaSpace?: boolean;
};

export function MotorcycleRelatedProducts({
  products,
  reserveMobileCtaSpace = false,
}: MotorcycleRelatedProductsProps) {
  const dict = useDictionary();
  const favorites = useMemo(
    () => products.map(catalogToFavoriteProduct),
    [products],
  );

  if (favorites.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="motorcycle-related-heading"
      className={cn(
        "relative overflow-hidden bg-moto pt-16 text-ink lg:pt-24",
        reserveMobileCtaSpace
          ? "pb-[calc(3rem+5.5rem+env(safe-area-inset-bottom))] lg:pb-20"
          : "pb-12 lg:pb-20",
      )}
    >
      <div className="site-container">
        <h2
          id="motorcycle-related-heading"
          className="mb-6 text-2xl font-extrabold uppercase text-ink sm:mb-5 sm:text-3xl"
        >
          {dict.motorcycle.similarBikes}
        </h2>

        <RidersFavoritesCarousel
          products={favorites}
          theme="light"
          imageMultiply
          compact
          slideDividers
        />
      </div>
    </section>
  );
}
