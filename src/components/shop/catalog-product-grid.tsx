"use client";

import { useRef } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { ProductCard } from "@/components/shop/product-card";

type CatalogProductGridProps = {
  products: readonly CatalogProduct[];
  listClassName?: string;
  itemClassName?: string;
  resetKey?: string;
};

export function CatalogProductGrid({
  products,
  listClassName,
  itemClassName,
  resetKey = "",
}: CatalogProductGridProps) {
  const resetKeyRef = useRef(resetKey);
  const prevLengthRef = useRef(products.length);
  const revealFromRef = useRef(0);

  if (resetKeyRef.current !== resetKey) {
    resetKeyRef.current = resetKey;
    revealFromRef.current = 0;
    prevLengthRef.current = products.length;
  } else if (products.length > prevLengthRef.current) {
    revealFromRef.current = prevLengthRef.current;
  }

  prevLengthRef.current = products.length;

  const revealFrom = revealFromRef.current;

  return (
    <ul className={listClassName} aria-live="polite">
      {products.map((product, index) => {
        const isNew = revealFrom > 0 && index >= revealFrom;
        const stagger = isNew ? (index - revealFrom) * 45 : 0;

        return (
          <li
            key={product.slug}
            className={
              itemClassName
                ? `${itemClassName}${isNew ? " motion-safe:animate-fade-up" : ""}`
                : isNew
                  ? "motion-safe:animate-fade-up"
                  : undefined
            }
            style={
              isNew
                ? ({ animationDelay: `${stagger}ms` } as const)
                : undefined
            }
          >
            <ProductCard product={product} />
          </li>
        );
      })}
    </ul>
  );
}
