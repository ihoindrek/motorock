import Link from "next/link";
import {
  RidersFavoritesCarousel,
  RidersFavoritesGrid,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import { PopularGearSection } from "@/components/popular-gear-section";
import { HomePromoBanners } from "@/components/home-promo-banners";
import { HomeSpotlightSection } from "@/components/home-spotlight-section";
import { ACTIVE_HOMEPAGE_SPOTLIGHT } from "@/data/homepage-spotlight";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import {
  getHomepageFavoriteCatalogs,
} from "@/lib/graphql/products";
import {
  partitionPopularGearByAudience,
  pickFavoriteProducts,
  pickHomepageNewGearProducts,
  pickHomepageProtectedGearProducts,
  filterHomepageAccessoriesProducts,
} from "@/lib/shop/favorite-product";

const blocks = [
  {
    id: "favorites-motorcycles",
    eyebrow: "Motorcycles",
    title: "Popular Bikes",
    href: "/shop/motorcycles",
    linkLabel: "Shop motorcycles →",
    theme: "light" as const,
    sectionClass: "home-section-padding bg-moto text-ink",
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
    figureBackground?: "moto" | "ink" | "detail" | "white" | "none";
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
        <header className="home-section-header">
          <div>
            <p className="section-eyebrow">{eyebrow}</p>
            <h3 id={id} className={`heading-block mt-3 sm:mt-4 ${titleClass}`}>
              {title}
            </h3>
          </div>
          <Link
            href={href}
            prefetch
            scroll
            className={`shrink-0 font-body text-xs font-bold uppercase tracking-aggressive transition-[color,border-color] duration-200 ${linkClass}`}
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
          motorcyclesEyebrow: "Mootorrattad",
          motorcyclesTitle: "Populaarsed rattad",
          motorcyclesCta: "Vaata mootorrattaid →",
          gearEyebrow: "Sõiduvarustus",
          gearTitle: "Uued tooted",
          gearCta: "Vaata sõiduvarustust →",
          gearTabMen: "Meestele",
          gearTabWomen: "Naistele",
          gearTabAccessories: "Aksessuaarid",
        }
      : {
          motorcyclesEyebrow: "Motorcycles",
          motorcyclesTitle: "Popular Bikes",
          motorcyclesCta: "Shop motorcycles →",
          gearEyebrow: "Equipment",
          gearTitle: "New Gear",
          gearCta: "Shop equipment →",
          gearTabMen: "For men",
          gearTabWomen: "For women",
          gearTabAccessories: "Accessories",
        };
  const {
    motorcycles,
    menEquipment,
    womenEquipment,
    accessoriesEquipment,
  } = await getHomepageFavoriteCatalogs(locale);

  const blockProducts: Record<string, FavoriteProduct[]> = {
    "favorites-motorcycles": pickFavoriteProducts(motorcycles, 6),
  };

  const gearByAudience = partitionPopularGearByAudience({
    men: menEquipment,
    women: womenEquipment,
    accessories: accessoriesEquipment,
  });

  const gearProductsByAudience = {
    men: pickHomepageNewGearProducts("men", gearByAudience.men, locale, 8),
    women: pickHomepageNewGearProducts("women", gearByAudience.women, locale, 8),
    accessories: pickHomepageNewGearProducts(
      "accessories",
      filterHomepageAccessoriesProducts(accessoriesEquipment),
      locale,
      8,
    ),
  };

  const spotlightProducts = pickHomepageProtectedGearProducts(
    [...gearByAudience.men, ...gearByAudience.women, ...accessoriesEquipment],
    ACTIVE_HOMEPAGE_SPOTLIGHT.limit,
  );

  return (
    <section>
      {blocks.map((block) => (
        <RidersFavoritesBlock
          key={block.id}
          {...block}
          href={localizedHref(locale, block.href)}
          eyebrow={copy.motorcyclesEyebrow}
          title={copy.motorcyclesTitle}
          linkLabel={copy.motorcyclesCta}
          products={blockProducts[block.id] ?? []}
        />
      ))}

      <PopularGearSection
        locale={locale}
        productsByAudience={gearProductsByAudience}
        copy={{
          eyebrow: copy.gearEyebrow,
          title: copy.gearTitle,
          cta: copy.gearCta,
          tabs: {
            men: copy.gearTabMen,
            women: copy.gearTabWomen,
            accessories: copy.gearTabAccessories,
          },
        }}
      />

      <HomePromoBanners locale={locale} />

      <HomeSpotlightSection
        locale={locale}
        spotlight={ACTIVE_HOMEPAGE_SPOTLIGHT}
        products={spotlightProducts}
      />
    </section>
  );
}
