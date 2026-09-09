import Image from "next/image";
import Link from "next/link";
import { partnerBrandLogos } from "@/data/partner-brands";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";

type HomeOfficialDealerBarProps = {
  locale: Locale;
};

function PartnerBrandLink({
  brand,
  locale,
  decorative = false,
}: {
  brand: (typeof partnerBrandLogos)[number];
  locale: Locale;
  decorative?: boolean;
}) {
  return (
    <Link
      href={localizedHref(locale, getBrandCatalogHref(brand.slug, locale))}
      className="inline-flex shrink-0 items-center justify-center opacity-50 transition-opacity duration-300 hover:opacity-100"
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : brand.name}
    >
      <Image
        src={brand.logo}
        alt={decorative ? "" : brand.name}
        width={brand.width}
        height={brand.height}
        className={brand.logoClassName}
      />
    </Link>
  );
}

export function HomeOfficialDealerBar({ locale }: HomeOfficialDealerBarProps) {
  const dict = getDictionary(locale);

  return (
    <section
      aria-labelledby="home-official-dealer-title"
      className="relative border-b border-paper/10 bg-ink text-paper"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        aria-hidden="true"
      />

      <div className="site-container py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="section-eyebrow text-paper/45">
            {dict.home.officialDealerEyebrow}
          </p>
          <h2
            id="home-official-dealer-title"
            className="mt-3 font-display text-[clamp(1.65rem,4.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-paper"
          >
            {dict.home.officialDealerTitle}
          </h2>
        </div>

        <div className="mt-9 overflow-hidden sm:mt-10 lg:mt-12">
          <div className="lg:hidden">
            <ul className="animate-spec-marquee flex w-max items-center gap-x-12 py-1 motion-reduce:animate-none sm:gap-x-14">
              {partnerBrandLogos.map((brand) => (
                <li key={brand.slug}>
                  <PartnerBrandLink brand={brand} locale={locale} />
                </li>
              ))}
              {partnerBrandLogos.map((brand) => (
                <li key={`${brand.slug}-repeat`} aria-hidden="true">
                  <PartnerBrandLink brand={brand} locale={locale} decorative />
                </li>
              ))}
            </ul>
          </div>

          <ul className="hidden items-center justify-between gap-x-6 gap-y-8 lg:flex xl:gap-x-8">
            {partnerBrandLogos.map((brand) => (
              <li key={brand.slug} className="flex flex-1 justify-center">
                <PartnerBrandLink brand={brand} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
