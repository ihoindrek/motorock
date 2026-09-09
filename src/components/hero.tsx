import Image from "next/image";
import Link from "next/link";
import { HeroBannerMedia } from "@/components/hero-banner-media";
import { equipmentHubBrands } from "@/data/equipment-hub";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { localizedHref } from "@/i18n/paths";
import { cn } from "@/lib/utils";

const motorcycleLogos = [
  {
    name: "Brixton",
    src: "/Brixton Motorcycles logo.svg",
    width: 130,
    height: 34,
    className: "h-7 w-auto sm:h-8",
    invert: true,
  },
  {
    name: "Mutt",
    src: "/mutt.svg",
    width: 88,
    height: 32,
    className: "h-6 w-auto sm:h-7",
    invert: true,
  },
  {
    name: "Motron",
    src: "/motron.svg",
    width: 120,
    height: 48,
    className: "h-7 w-auto sm:h-8",
    invert: true,
  },
  {
    name: "Malaguti",
    src: "/malaguti.svg",
    width: 120,
    height: 22,
    className: "h-5 w-auto sm:h-6",
    invert: true,
  },
] as const;

const equipmentLogos = equipmentHubBrands.map((brand) => ({
  name: brand.name,
  src: brand.logo,
  width: 110,
  height: 36,
  invert: brand.logoInvert ?? false,
  className: "h-5 w-auto max-w-[5.25rem] sm:h-6 sm:max-w-[6rem]",
}));

type HeroLogo = (typeof motorcycleLogos)[number] | (typeof equipmentLogos)[number];

function HeroBannerLogo({
  logo,
  decorative = false,
}: {
  logo: HeroLogo;
  decorative?: boolean;
}) {
  return (
    <Image
      src={logo.src}
      alt={decorative ? "" : logo.name}
      width={logo.width}
      height={logo.height}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        logo.className,
        "opacity-90 transition-opacity duration-300 group-hover:opacity-100",
        logo.invert && "brightness-0 invert",
      )}
    />
  );
}

function HeroBannerLogos({
  logos,
  marquee = false,
  gapClassName,
}: {
  logos: readonly HeroLogo[];
  marquee?: boolean;
  gapClassName: string;
}) {
  if (marquee) {
    return (
      <div className="w-full overflow-hidden">
        <ul
          className={cn(
            "animate-spec-marquee flex w-max items-center py-1 motion-reduce:animate-none",
            gapClassName,
          )}
        >
          {logos.map((logo) => (
            <li key={logo.name} className="shrink-0">
              <HeroBannerLogo logo={logo} />
            </li>
          ))}
          {logos.map((logo) => (
            <li key={`${logo.name}-repeat`} className="shrink-0" aria-hidden="true">
              <HeroBannerLogo logo={logo} decorative />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center justify-center", gapClassName)}>
      {logos.map((logo) => (
        <li key={logo.name}>
          <HeroBannerLogo logo={logo} />
        </li>
      ))}
    </ul>
  );
}

type HeroProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function Hero({ locale, dictionary }: HeroProps) {
  const banners = [
    {
      label: dictionary.hero.motorcycles,
      href: localizedHref(locale, "/shop/motorcycles"),
      image: "/brixton-image.webp",
      mobileImage: "/hero-fallback.webp",
      video: "/Brixton-Neu.webm",
      span: "col-span-1",
      imageSizes: "(max-width: 768px) 100vw, 50vw",
      titleClass: "text-3xl sm:text-4xl lg:text-6xl",
      cta: dictionary.hero.shopMotorcycles,
      ctaClass: "btn-hero-primary",
      logos: motorcycleLogos,
      compactLogos: false,
      imageClassName:
        "object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105",
    },
    {
      label: dictionary.hero.equipment,
      href: localizedHref(locale, buildEquipmentHubHref(locale)),
      image: "/drivin-eq-banner.jpg",
      mobileImage: "/drivin-eq-banner.jpg",
      video: undefined,
      span: "col-span-1",
      imageSizes: "(max-width: 768px) 100vw, 50vw",
      titleClass: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl",
      cta: dictionary.hero.browseProducts,
      ctaClass: "btn-hero-primary",
      logos: equipmentLogos,
      compactLogos: true,
      marqueeLogos: true,
      imageClassName:
        "object-cover object-[center_30%] transition-transform duration-700 ease-out group-hover:scale-105",
    },
  ] as const;

  return (
    <section
      aria-label={dictionary.common.shop}
      className="grid grid-cols-1 md:grid-cols-2"
    >
      <h1 className="sr-only">{`Motorock.eu — ${dictionary.seo.homeTitle}`}</h1>

      {banners.map((banner, index) => (
          <Link
            key={banner.href}
            href={banner.href}
            prefetch
            scroll
            className={`group relative flex min-h-[40svh] items-center justify-center overflow-hidden sm:min-h-[46svh] lg:min-h-[62svh] ${banner.span}`}
          >
            {banner.video ? (
              <HeroBannerMedia
                mobileImage={banner.mobileImage}
                desktopPoster={banner.image}
                video={banner.video}
                imageSizes={banner.imageSizes}
                priority={index === 0}
              />
            ) : (
              <Image
                src={banner.image}
                alt=""
                fill
                priority={index === 0}
                className={banner.imageClassName}
                sizes={banner.imageSizes}
              />
            )}
            <div
              className="absolute inset-0 bg-ink/30 transition-colors duration-300 group-hover:bg-ink/20"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-ink/25"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col items-center gap-5 px-4 sm:gap-7">
              <h2
                className={`whitespace-pre-line text-center font-display font-extrabold uppercase leading-[0.95] tracking-tight text-paper drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-[1.02] ${banner.titleClass}`}
              >
                {banner.label}
              </h2>

              {banner.logos ? (
                <HeroBannerLogos
                  logos={banner.logos}
                  marquee={"marqueeLogos" in banner && banner.marqueeLogos}
                  gapClassName={
                    banner.compactLogos
                      ? "gap-3 sm:gap-4"
                      : "gap-5 sm:gap-7 lg:gap-8"
                  }
                />
              ) : null}

              <span
                className={`${banner.ctaClass} mt-1 transition-transform duration-300 group-hover:scale-105`}
              >
                {banner.cta}
              </span>
            </div>
          </Link>
        ))}
    </section>
  );
}
