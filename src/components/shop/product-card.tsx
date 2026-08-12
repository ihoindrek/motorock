"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { BrandLogo } from "@/components/shop/brand-logo";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { Price } from "@/components/shop/price";
import { useDictionary, useLocale } from "@/context/locale-context";
import {
  buildProductColorOptions,
  getColorSwatchStyle,
} from "@/lib/shop/product-color-swatches";
import { localizedProductHref } from "@/lib/shop/product-url";

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const isMotorcycle = product.type === "motorcycle";
  const [previewIndex, setPreviewIndex] = useState(0);
  const colorOptions = useMemo(
    () => buildProductColorOptions(product.colors, product.variations),
    [product.colors, product.variations],
  );
  const visibleColorOptions = colorOptions.slice(0, 3);
  const hasMoreColors = colorOptions.length > visibleColorOptions.length;
  const previewImages = useMemo(() => {
    const images = [
      product.image,
      ...colorOptions.map((option) => option.image).filter(Boolean),
      ...(product.gallery ?? []),
    ].filter((src): src is string => Boolean(src));

    return [...new Set(images)].slice(0, 4);
  }, [colorOptions, product.gallery, product.image]);
  const activePreviewImage =
    previewImages[Math.min(previewIndex, previewImages.length - 1)] ?? product.image;

  return (
    <article className="group relative flex h-full flex-col">
      <Link
        href={localizedProductHref(product.slug, locale)}
        prefetch={isMotorcycle ? true : undefined}
        className="flex h-full flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <figure
          className={
            isMotorcycle
              ? "relative aspect-[4/3] overflow-hidden bg-moto"
              : "relative overflow-hidden rounded-sm border border-ink/10 bg-white shadow-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-[0_20px_50px_-20px_rgba(255,90,0,0.35),0_8px_24px_-12px_rgba(11,11,11,0.12)] aspect-[3/4]"
          }
          onMouseLeave={() => setPreviewIndex(0)}
          onMouseMove={(event) => {
            if (previewImages.length <= 1 || isMotorcycle) {
              return;
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            const relativeX = (event.clientX - bounds.left) / bounds.width;
            const nextIndex = Math.min(
              previewImages.length - 1,
              Math.max(0, Math.floor(relativeX * previewImages.length)),
            );
            setPreviewIndex(nextIndex);
          }}
        >
          {product.isNew ? (
            <span className="absolute left-3 top-3 z-10 bg-accent px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              {dict.motorcycle.newBadge}
            </span>
          ) : null}
          {isMotorcycle && product.showroomAvailable && product.inStock ? (
            <InStoreNowBadge variant="overlay" />
          ) : null}
          {!product.inStock ? (
            <span className="absolute left-3 top-3 z-10 bg-ink px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              {dict.search.soldOut}
            </span>
          ) : null}

          <Image
            src={activePreviewImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`relative z-0 transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              isMotorcycle
                ? "object-contain object-center p-3 mix-blend-multiply group-hover:scale-[1.06] sm:p-4"
                : "object-contain object-center p-0.5 group-hover:scale-[1.02] sm:p-1"
            }`}
          />
        </figure>

        <div
          className={`flex flex-1 flex-col gap-1 ${isMotorcycle ? "pt-2" : "pt-3"}`}
        >
          <BrandLogo
            brand={product.brand}
            size="sm"
            className={
              isMotorcycle
                ? "h-6 max-w-[132px] contrast-125 text-ink"
                : undefined
            }
          />
          <h3
            className={`font-body normal-case leading-snug tracking-normal transition-colors duration-200 ${
              isMotorcycle
                ? "text-lg font-bold text-ink group-hover:text-accent sm:text-xl lg:text-[1.35rem]"
                : "text-base font-semibold text-ink group-hover:text-ink sm:text-lg"
            }`}
          >
            {product.name}
          </h3>
          <Price
            value={product.price}
            as="p"
            className="mt-auto transition-colors duration-200 group-hover:text-accent"
          />
          {!isMotorcycle && visibleColorOptions.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5">
              {visibleColorOptions.map((option) => (
                <span
                  key={option.value ?? option.label}
                  className="size-2.5 shrink-0 rounded-full border border-ink/15"
                  style={getColorSwatchStyle(option)}
                  aria-label={option.label}
                  title={option.label}
                />
              ))}
              {hasMoreColors ? (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-aggressive text-ink/45"
                  aria-hidden="true"
                >
                  <span>&rsaquo;</span>
                  <span>{colorOptions.length - visibleColorOptions.length}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
