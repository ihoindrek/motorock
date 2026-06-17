import Link from "next/link";
import {
  RidersFavoritesCarousel,
  RidersFavoritesGrid,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import { PopularGearSection } from "@/components/popular-gear-section";
import { VideoText } from "@/components/video-text";
import type { Locale } from "@/i18n/config";
import {
  getEquipmentCatalogForRoute,
  getMotorcycleCatalog,
} from "@/lib/graphql/products";
import { parseEquipmentSlug } from "@/lib/shop/category";
import {
  partitionPopularGearByAudience,
  pickFavoriteProducts,
  pickPopularGearProducts,
} from "@/lib/shop/favorite-product";

const headingVideoClass =
  "font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-7xl";

const blocks = [
  {
    id: "favorites-motorcycles",
    eyebrow: "Motorcycles",
    title: "Popular Bikes",
    href: "/shop/motorcycles",
    linkLabel: "Shop motorcycles →",
    theme: "light" as const,
    sectionClass: "bg-moto text-ink py-20 lg:py-24",
    titleClass: "text-ink",
    linkClass:
      "inline-flex items-center rounded-full bg-ink px-7 py-3 text-paper transition-colors duration-200 hover:bg-accent",
    limit: 6,
    layout: "carousel" as const,
    carousel: {
      imageMultiply: true,
      compact: true,
      slideDividers: true,
    },
  },
] as const;

type RidersFavoritesBlockProps = {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  products: FavoriteProduct[];
  theme: "light" | "dark";
  sectionClass: string;
  titleClass: string;
  linkClass: string;
  layout: "carousel" | "grid" | "responsive-grid";
  carousel: {
    imageMultiply: boolean;
    compact: boolean;
    slideDividers: boolean;
    figureBackground?: "moto" | "ink" | "detail" | "none";
  };
};

function RidersFavoritesBlock({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
  products,
  theme,
  sectionClass,
  titleClass,
  linkClass,
  layout,
  carousel,
}: RidersFavoritesBlockProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={id}
      className={`relative overflow-hidden ${sectionClass}`}
    >
      <div className="relative z-10 site-container">
        <header
          className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
            theme === "light" ? "sm:mb-5" : "sm:mb-8"
          }`}
        >
          <div>
            <p className="section-eyebrow">{eyebrow}</p>
            <h3
              id={id}
              className={`mt-2 text-2xl font-extrabold uppercase sm:text-3xl ${titleClass}`}
            >
              {title}
            </h3>
          </div>
          <Link
            href={href}
            className={`self-start font-body text-xs font-bold uppercase tracking-aggressive transition-[color,border-color] duration-200 sm:self-auto ${linkClass}`}
          >
            {linkLabel}
          </Link>
        </header>

        {layout === "responsive-grid" ? (
          <>
            <div className="md:hidden">
              <RidersFavoritesCarousel
                products={products}
                theme={theme}
                imageMultiply={carousel.imageMultiply}
                compact={carousel.compact}
                slideDividers={carousel.slideDividers}
                figureBackground={carousel.figureBackground}
                mobilePeek
              />
            </div>
            <div className="hidden md:block">
              <RidersFavoritesGrid
                products={products}
                theme={theme}
                imageMultiply={carousel.imageMultiply}
                compact={carousel.compact}
                figureBackground={carousel.figureBackground}
                columns={4}
              />
            </div>
          </>
        ) : layout === "grid" ? (
          <RidersFavoritesGrid
            products={products}
            theme={theme}
            imageMultiply={carousel.imageMultiply}
            compact={carousel.compact}
            figureBackground={carousel.figureBackground}
            columns={4}
          />
        ) : (
          <RidersFavoritesCarousel
            products={products}
            theme={theme}
            imageMultiply={carousel.imageMultiply}
            compact={carousel.compact}
            slideDividers={carousel.slideDividers}
            figureBackground={carousel.figureBackground}
          />
        )}
      </div>
    </section>
  );
}

export async function RidersFavorites({ locale }: { locale: Locale }) {
  const copy =
    locale === "et"
      ? {
          rebelTop: "Mässuline",
          rebelBottom: "kahel rattal.",
          description:
            "Premium sõiduvarustus ja mootorrattad sõitjatele, kes ei taha massi sulanduda.",
          motorcyclesEyebrow: "Mootorrattad",
          motorcyclesTitle: "Populaarsed rattad",
          motorcyclesCta: "Vaata mootorrattaid →",
        }
      : {
          rebelTop: "Rebel on",
          rebelBottom: "two wheels.",
          description:
            "Premium riding gear and motorcycles for riders who refuse to blend in.",
          motorcyclesEyebrow: "Motorcycles",
          motorcyclesTitle: "Popular Bikes",
          motorcyclesCta: "Shop motorcycles →",
        };
  const [motorcycles, menEquipment, womenEquipment, accessoriesEquipment] =
    await Promise.all([
      getMotorcycleCatalog(locale),
      getEquipmentCatalogForRoute(parseEquipmentSlug(["men"]), locale),
      getEquipmentCatalogForRoute(parseEquipmentSlug(["women"]), locale),
      getEquipmentCatalogForRoute(parseEquipmentSlug(["accessories"]), locale),
    ]);

  const blockProducts: Record<string, FavoriteProduct[]> = {
    "favorites-motorcycles": pickFavoriteProducts(motorcycles, 6),
  };

  const gearByAudience = partitionPopularGearByAudience({
    men: menEquipment,
    women: womenEquipment,
    accessories: accessoriesEquipment,
  });

  const gearProductsByAudience = {
    men: pickPopularGearProducts("men", gearByAudience.men, 8),
    women: pickPopularGearProducts("women", gearByAudience.women, 8),
    accessories: pickPopularGearProducts("accessories", gearByAudience.accessories, 8),
  };

  return (
    <section aria-labelledby="favorites-heading">
      <header className="relative overflow-hidden bg-ink px-5 py-16 text-paper sm:px-8 lg:px-12 lg:py-24">
        <div className="relative z-10 mx-auto flex max-w-site flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h2
            id="favorites-heading"
            className={`max-w-4xl shrink-0 ${headingVideoClass}`}
          >
            <VideoText
              videoSrc="/5052415-hd_1920_1080_30fps.mp4"
              className={headingVideoClass}
            >
              {copy.rebelTop}
            </VideoText>
            <br />
            <span className="bg-gradient-to-r from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] bg-clip-text text-transparent">
              {copy.rebelBottom}
            </span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-paper/75 sm:text-lg lg:pb-2 lg:text-right">
            {copy.description}
          </p>
        </div>
      </header>

      {blocks.map((block) => (
        <RidersFavoritesBlock
          key={block.id}
          {...block}
          eyebrow={copy.motorcyclesEyebrow}
          title={copy.motorcyclesTitle}
          linkLabel={copy.motorcyclesCta}
          products={blockProducts[block.id] ?? []}
        />
      ))}

      <PopularGearSection productsByAudience={gearProductsByAudience} />
    </section>
  );
}
