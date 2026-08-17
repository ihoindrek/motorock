import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { buildEquipmentCategoryHref } from "@/lib/shop/category-url";

function womenJacketsHref(locale: Locale) {
  return locale === "et"
    ? buildEquipmentCategoryHref("et", "naistele", "jakid-ja-tagid")
    : buildEquipmentCategoryHref("en", "for-women", "jackets-and-tags-2");
}

type HomePromoBanner = {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  cta: string;
  logo?: {
    src: string;
    width: number;
    height: number;
    className: string;
    invert?: boolean;
  };
};

export function HomePromoBanners({ locale }: { locale: Locale }) {
  const copy =
    locale === "et"
      ? {
          holyfreedomEyebrow: "Holyfreedom",
          holyfreedomTitle: "Uued tooted",
          holyfreedomCta: "Vaata Holyfreedom →",
          womenEyebrow: "Naistele",
          womenTitle: "Joped ja tagid",
          womenCta: "Vaata naiste jopesid →",
        }
      : {
          holyfreedomEyebrow: "Holyfreedom",
          holyfreedomTitle: "New arrivals",
          holyfreedomCta: "Shop Holyfreedom →",
          womenEyebrow: "For women",
          womenTitle: "Jackets & vests",
          womenCta: "Shop women's jackets →",
        };

  const banners: HomePromoBanner[] = [
    {
      href: localizedHref(locale, buildBrandCatalogHref(locale, "holyfreedom")),
      image: "/tutonero.jpg",
      eyebrow: copy.holyfreedomEyebrow,
      title: copy.holyfreedomTitle,
      cta: copy.holyfreedomCta,
      logo: {
        src: "/HF-Wht.png",
        width: 140,
        height: 40,
        className: "h-7 w-auto sm:h-8",
      },
    },
    {
      href: localizedHref(locale, womenJacketsHref(locale)),
      image: "/woman-leather-black-jacket.jpg",
      eyebrow: copy.womenEyebrow,
      title: copy.womenTitle,
      cta: copy.womenCta,
    },
  ];

  return (
    <section
      aria-label={locale === "et" ? "Soovitused" : "Highlights"}
      className="bg-detail py-8 sm:py-10 lg:py-12"
    >
      <div className="site-container grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
        {banners.map((banner) => (
          <Link
            key={banner.href}
            href={banner.href}
            prefetch
            scroll
            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-sm"
          >
            <Image
              src={banner.image}
              alt=""
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, calc((min(100vw, 1280px) - 3rem) / 2)"
            />
            <div
              className="absolute inset-0 bg-ink/35 transition-colors duration-300 group-hover:bg-ink/25"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-ink/30"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center sm:gap-5">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em] text-paper/70">
                {banner.eyebrow}
              </p>

              {banner.logo ? (
                <Image
                  src={banner.logo.src}
                  alt={banner.eyebrow}
                  width={banner.logo.width}
                  height={banner.logo.height}
                  className={`${banner.logo.className} opacity-95 transition-opacity duration-300 group-hover:opacity-100`}
                />
              ) : null}

              <h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-paper drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.02] sm:text-4xl lg:text-5xl">
                {banner.title}
              </h3>

              <span className="btn-hero-ghost mt-1 transition-transform duration-300 group-hover:scale-105">
                {banner.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
