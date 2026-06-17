import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localizedHref } from "@/i18n/paths";

const motorcycleLogos = [
  {
    name: "Brixton",
    src: "/Brixton Motorcycles logo.svg",
    width: 130,
    height: 34,
    className: "h-7 w-auto sm:h-8",
  },
  {
    name: "Mutt",
    src: "/mutt.svg",
    width: 88,
    height: 32,
    className: "h-6 w-auto sm:h-7",
  },
  {
    name: "Motron",
    src: "/motron.svg",
    width: 120,
    height: 48,
    className: "h-7 w-auto sm:h-8",
  },
  {
    name: "Malaguti",
    src: "/malaguti.svg",
    width: 120,
    height: 22,
    className: "h-5 w-auto sm:h-6",
  },
] as const;

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
      video: "/5052415-hd_1920_1080_30fps.mp4",
      span: "col-span-1 md:col-span-2",
      imageSizes: "(max-width: 768px) 100vw, 66vw",
      titleClass: "text-3xl sm:text-4xl lg:text-6xl",
      cta: dictionary.hero.shopMotorcycles,
      ctaClass: "btn-hero-primary",
      logos: motorcycleLogos,
    },
    {
      label: dictionary.hero.equipment,
      href: localizedHref(locale, "/shop/equipment"),
      image: "/JRH10015_L23.webp",
      video: undefined,
      span: "col-span-1",
      imageSizes: "(max-width: 768px) 100vw, 33vw",
      titleClass: "text-xl sm:text-2xl lg:text-3xl",
      cta: dictionary.hero.browseProducts,
      ctaClass: "btn-hero-ghost px-5 py-3 sm:px-6 sm:py-3",
      logos: null,
    },
  ] as const;

  return (
    <section
      aria-label={dictionary.common.shop}
      className="grid grid-cols-1 md:grid-cols-3"
    >
      <h1 className="sr-only">Motorock.eu</h1>

      {banners.map(
        (
          {
            label,
            href,
            image,
            video,
            span,
            imageSizes,
            titleClass,
            cta,
            ctaClass,
            logos,
          },
          index,
        ) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex min-h-[40svh] items-center justify-center overflow-hidden sm:min-h-[46svh] lg:min-h-[52svh] ${span}`}
          >
            {video ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={image}
                src={video}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                aria-hidden="true"
              />
            ) : (
              <Image
                src={image}
                alt=""
                fill
                priority={index === 0}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes={imageSizes}
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
                className={`whitespace-pre-line text-center font-display font-extrabold uppercase leading-[0.95] tracking-tight text-paper drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-[1.02] ${titleClass}`}
              >
                {label}
              </h2>

              {logos ? (
                <ul className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 lg:gap-8">
                  {logos.map((logo) => (
                    <li key={logo.name}>
                      <Image
                        src={logo.src}
                        alt={logo.name}
                        width={logo.width}
                        height={logo.height}
                        className={`${logo.className} brightness-0 invert opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              <span
                className={`${ctaClass} mt-1 transition-transform duration-300 group-hover:scale-105`}
              >
                {cta}
              </span>
            </div>
          </Link>
        ),
      )}
    </section>
  );
}
