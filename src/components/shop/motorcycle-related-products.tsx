"use client";

import { useMemo } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { RidersFavoritesCarousel } from "@/components/riders-favorites-carousel";
import { catalogToFavoriteProduct } from "@/lib/shop/favorite-product";

type MotorcycleRelatedProductsProps = {
  products: readonly CatalogProduct[];
};

export function MotorcycleRelatedProducts({
  products,
}: MotorcycleRelatedProductsProps) {
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
      className="relative overflow-hidden bg-moto pt-16 pb-16 text-ink lg:pt-24 lg:pb-24"
    >
      <div className="site-container">
        <h2
          id="motorcycle-related-heading"
          className="mb-6 text-2xl font-extrabold uppercase text-ink sm:mb-5 sm:text-3xl"
        >
          Similar bikes
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
