"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { BrandLogo } from "@/components/shop/brand-logo";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { NewProductBadge } from "@/components/shop/new-product-badge";
import { MotorcyclePrice } from "@/components/shop/motorcycle-price";
import { Price } from "@/components/shop/price";
import { ProductCardQuickAdd } from "@/components/shop/product-card-quick-add";
import { useDictionary, useLocale } from "@/context/locale-context";
import {
  buildProductColorOptions,
  getColorSwatchStyle,
} from "@/lib/shop/product-color-swatches";
import { getProductQuickAddMode } from "@/lib/shop/product-quick-add";
import { MotorcycleProductImage } from "@/components/shop/motorcycle-product-image";
import { localizedProductHref } from "@/lib/shop/product-url";

type ProductCardProps = {
  product: CatalogProduct;
};

const EQUIPMENT_IMAGE_CLASS = "object-contain object-center p-4 sm:p-5";
const EQUIPMENT_IMAGE_LAYER =
  "absolute inset-0 bg-catalog [&_img]:mix-blend-multiply";
const MOTORCYCLE_FIGURE_CLASS = "relative aspect-[4/3] overflow-hidden bg-moto";

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const isMotorcycle = product.type === "motorcycle";
  const productHref = localizedProductHref(product.slug, locale);
  const quickAddMode = getProductQuickAddMode(product);
  const colorOptions = useMemo(
    () => buildProductColorOptions(product.colors, product.variations),
    [product.colors, product.variations],
  );
  const visibleColorOptions = colorOptions.slice(0, 3);
  const hasMoreColors = colorOptions.length > visibleColorOptions.length;
  const hoverGalleryImage = useMemo(() => {
    if (isMotorcycle) {
      return undefined;
    }

    const gallery = product.gallery ?? [];
    if (gallery.length === 0) {
      return undefined;
    }

    return (
      gallery.find((src) => src && src !== product.image) ?? gallery[0]
    );
  }, [isMotorcycle, product.gallery, product.image]);
  const imageClassName = isMotorcycle
    ? "absolute inset-0 h-full w-full object-contain object-center p-3 mix-blend-multiply transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-hover:scale-[1.06] sm:p-4"
    : EQUIPMENT_IMAGE_CLASS;
  const imageFadeClass =
    "transition-[opacity,transform] duration-500 ease-in-out motion-reduce:transition-none";

  return (
    <article className="group relative flex h-full flex-col">
      <figure
        className={
          isMotorcycle
            ? MOTORCYCLE_FIGURE_CLASS
            : "relative isolate aspect-[3/4] overflow-hidden rounded-sm bg-catalog shadow-none transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_-20px_rgba(255,90,0,0.35),0_8px_24px_-12px_rgba(11,11,11,0.12)]"
        }
      >
        <Link
          href={productHref}
          prefetch={isMotorcycle ? true : undefined}
          className="absolute inset-0 z-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={product.name}
        >
          {hoverGalleryImage ? (
            <>
              <div
                className={`${EQUIPMENT_IMAGE_LAYER} ${imageFadeClass} opacity-100 group-hover:opacity-0 motion-reduce:group-hover:opacity-100`}
              >
                <Image
                  src={product.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`${imageClassName} ${imageFadeClass} group-hover:scale-[1.02] motion-reduce:group-hover:scale-100`}
                />
              </div>
              <div
                className={`${EQUIPMENT_IMAGE_LAYER} ${imageFadeClass} opacity-0 group-hover:opacity-100 motion-reduce:opacity-0 motion-reduce:group-hover:opacity-0`}
              >
                <Image
                  src={hoverGalleryImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`${imageClassName} ${imageFadeClass} scale-[1.03] group-hover:scale-[1.02] motion-reduce:scale-100 motion-reduce:group-hover:scale-100`}
                />
              </div>
            </>
          ) : isMotorcycle ? (
            <MotorcycleProductImage src={product.image} className={imageClassName} />
          ) : (
            <div className={EQUIPMENT_IMAGE_LAYER}>
              <Image
                src={product.image}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`relative z-0 transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${imageClassName} group-hover:scale-[1.02]`}
              />
            </div>
          )}
        </Link>

        {product.isNew ? <NewProductBadge variant="overlay" /> : null}
        {isMotorcycle && product.showroomAvailable && product.inStock ? (
          <InStoreNowBadge variant="overlay" />
        ) : null}
        {!product.inStock ? (
          <span
            className={`absolute left-3 z-10 bg-ink px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper ${
              product.isNew ? "bottom-3 top-auto" : "top-3"
            }`}
          >
            {dict.search.soldOut}
          </span>
        ) : null}

        {!isMotorcycle ? (
          <ProductCardQuickAdd product={product} mode={quickAddMode} />
        ) : null}
      </figure>

      <Link
        href={productHref}
        prefetch={isMotorcycle ? true : undefined}
        className={`flex flex-1 flex-col gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isMotorcycle ? "pt-4 sm:pt-5" : "pt-5 sm:pt-6"
        }`}
      >
        <BrandLogo brand={product.brand} size="sm" />
        <h3
          className={`font-body normal-case leading-snug tracking-normal transition-colors duration-200 ${
            isMotorcycle
              ? "text-lg font-bold text-ink group-hover:text-accent sm:text-xl lg:text-[1.35rem]"
              : "text-base font-semibold text-ink group-hover:text-ink sm:text-lg"
          }`}
        >
          {product.name}
        </h3>
        {isMotorcycle ? (
          <MotorcyclePrice
            price={product.price}
            regularPrice={product.regularPrice}
            showDiscountBadge
            as="p"
            className="mt-auto transition-colors duration-200 group-hover:text-accent"
          />
        ) : (
          <Price
            value={product.price}
            as="p"
            className="mt-auto transition-colors duration-200 group-hover:text-accent"
          />
        )}
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
      </Link>
    </article>
  );
}
