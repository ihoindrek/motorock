import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog-product";
import { BrandLogo } from "@/components/shop/brand-logo";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { Price } from "@/components/shop/price";

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const isMotorcycle = product.type === "motorcycle";

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/shop/product/${product.slug}`}
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
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:opacity-0 bg-[radial-gradient(ellipse_62%_100%_at_50%_100%,rgb(255_90_0_/_0.28),transparent_72%)]"
              aria-hidden="true"
            />
          )}
          {!isMotorcycle ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          ) : null}

          {product.isNew ? (
            <span className="absolute left-3 top-3 z-10 bg-accent px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              New
            </span>
          ) : null}
          {isMotorcycle && product.showroomAvailable && product.inStock ? (
            <InStoreNowBadge variant="overlay" />
          ) : null}
          {!product.inStock ? (
            <span className="absolute right-3 top-3 z-10 bg-ink px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
              Sold out
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
            className={`font-body text-base normal-case leading-snug tracking-normal transition-colors duration-200 sm:text-lg ${
              isMotorcycle
                ? "font-bold text-ink group-hover:text-accent"
                : "font-semibold text-ink group-hover:text-ink"
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
