"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog-product";
import { BrandLogo } from "@/components/shop/brand-logo";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { Price } from "@/components/shop/price";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedProductHref } from "@/lib/shop/product-url";

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const isMotorcycle = product.type === "motorcycle";

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={localizedProductHref(product.slug, locale)}
        prefetch={isMotorcycle ? true : undefined}
        className="flex h-full flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <figure
          className={
            isMotorcycle
              ? "relative aspect-[4/3] overflow-hidden bg-moto"
              : "relative overflow-hidden rounded-sm border border-ink/10 shadow-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-[0_20px_50px_-20px_rgba(255,90,0,0.35),0_8px_24px_-12px_rgba(11,11,11,0.12)] aspect-[4/5]"
          }
        >
          {!isMotorcycle ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-ink/30 via-ink/5 to-transparent"
              aria-hidden="true"
            />
          ) : (
            <div className="moto-catalog-glow" aria-hidden="true" />
          )}
          {!isMotorcycle ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          ) : null}

          {product.isNew ? (
            <span className="absolute left-3 top-3 z-10 bg-accent px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              {dict.motorcycle.newBadge}
            </span>
          ) : null}
          {isMotorcycle && product.showroomAvailable && product.inStock ? (
            <InStoreNowBadge variant="overlay" />
          ) : null}
          {!product.inStock ? (
            <span className="absolute right-3 top-3 z-10 bg-ink px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              {dict.search.soldOut}
            </span>
          ) : null}

          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`relative z-0 transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              isMotorcycle
                ? "object-contain object-center p-3 mix-blend-multiply group-hover:scale-[1.06] sm:p-4"
                : "object-cover object-center group-hover:scale-110"
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
        </div>
      </Link>
    </article>
  );
}
