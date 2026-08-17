import Link from "next/link";
import {
  RidersFavoritesCarousel,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import type { HomepageSpotlightConfig } from "@/data/homepage-spotlight";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

type HomeSpotlightSectionProps = {
  locale: Locale;
  spotlight: HomepageSpotlightConfig;
  products: readonly FavoriteProduct[];
};

export function HomeSpotlightSection({
  locale,
  spotlight,
  products,
}: HomeSpotlightSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const copy = spotlight.copy[locale];

  return (
    <section
      aria-labelledby={`home-spotlight-${spotlight.id}`}
      className="relative overflow-hidden bg-detail pb-20 pt-4 text-ink sm:pt-6 lg:pb-24 lg:pt-8"
    >
      <div className="site-container relative z-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h3 id={`home-spotlight-${spotlight.id}`} className="heading-block mt-2 text-ink">
              {copy.title}
            </h3>
          </div>
          <Link
            href={localizedHref(locale, spotlight.categoryHref[locale])}
            className="inline-flex items-center self-start rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper sm:self-auto"
          >
            {copy.cta}
          </Link>
        </header>

        <RidersFavoritesCarousel
          products={products}
          theme="light"
          compact={false}
          slideDividers={false}
          figureBackground="white"
          slideGroup={2}
        />
      </div>
    </section>
  );
}
