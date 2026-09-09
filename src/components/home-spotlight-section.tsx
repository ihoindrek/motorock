import Link from "next/link";
import { CatalogProductCarousel } from "@/components/shop/catalog-product-carousel";
import type { CatalogProduct } from "@/types/catalog-product";
import type { HomepageSpotlightConfig } from "@/data/homepage-spotlight";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

type HomeSpotlightSectionProps = {
  locale: Locale;
  spotlight: HomepageSpotlightConfig;
  products: readonly CatalogProduct[];
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
      className="home-section-padding relative overflow-hidden bg-white text-ink"
    >
      <div className="site-container relative z-10">
        <header className="home-section-header">
          <div>
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h3
              id={`home-spotlight-${spotlight.id}`}
              className="heading-block mt-3 text-ink sm:mt-4"
            >
              {copy.title}
            </h3>
          </div>
          <Link
            href={localizedHref(locale, spotlight.categoryHref[locale])}
            className="inline-flex shrink-0 items-center rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper"
          >
            {copy.cta}
          </Link>
        </header>

        <CatalogProductCarousel
          products={products}
          slideGroup={2}
          ariaLabel={copy.title}
        />
      </div>
    </section>
  );
}
