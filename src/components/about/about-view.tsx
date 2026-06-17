import Image from "next/image";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { EditorialHero } from "@/components/content/editorial-hero";
import { brands } from "@/data/brands";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

const purchaseReasonsByLocale: Record<Locale, readonly {
  title: string;
  subtitle: string;
  body: string;
  offset: string;
  Icon: LucideIcon;
}[]> = {
  en: [
    {
      title: "Fast delivery",
      subtitle: "International shipping",
      body: "Your order on the road, not on hold — EU-wide.",
      offset: "lg:ml-[6%]",
      Icon: Truck,
    },
    {
      title: "14 days",
      subtitle: "Return policy",
      body: "Changed your mind? Send it back within 14 days.",
      offset: "lg:ml-auto lg:mr-[10%]",
      Icon: RotateCcw,
    },
    {
      title: "Guaranteed",
      subtitle: "Quality products",
      body: "Gear we'd put on our own bikes — not shelf filler.",
      offset: "lg:ml-[28%]",
      Icon: ShieldCheck,
    },
  ],
  et: [
    {
      title: "Kiire tarne",
      subtitle: "Rahvusvaheline kohaletoimetus",
      body: "Sinu tellimus liigub, mitte ei oota — üle kogu EL-i.",
      offset: "lg:ml-[6%]",
      Icon: Truck,
    },
    {
      title: "14 päeva",
      subtitle: "Tagastusõigus",
      body: "Mõtlesid ümber? Saada 14 päeva jooksul tagasi.",
      offset: "lg:ml-auto lg:mr-[10%]",
      Icon: RotateCcw,
    },
    {
      title: "Garanteeritud",
      subtitle: "Kvaliteetsed tooted",
      body: "Varustus, mille paneksime ka oma ratastele.",
      offset: "lg:ml-[28%]",
      Icon: ShieldCheck,
    },
  ],
};

const motorcycleBrands = brands.filter(
  (brand): brand is typeof brand & { logo: string } => Boolean(brand.logo),
);

const proseClassName =
  "text-base font-medium leading-[1.7] text-ink sm:text-lg";
const proseMutedClassName =
  "text-base font-medium leading-[1.7] text-ink/85 sm:text-lg";

const headingClassName =
  "font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink";

type AboutViewProps = {
  locale: Locale;
};

export function AboutView({ locale }: AboutViewProps) {
  const purchaseReasons = purchaseReasonsByLocale[locale];
  const t =
    locale === "et"
      ? {
          hero: {
            eyebrow: "Meist",
            title: "Stiil kohtub",
            accent: "seiklusega.",
            description:
              "Tahame olla esimene valik neile, kes hindavad vabadust ja enesekindlust.",
          },
          howItStarted: "Kuidas see kõik algas?",
          originP1:
            "Kõik algas Tarmo mõttest, et tema täisealiseks saavale tütrele on vaja ägedat ratast. Veebis ringi vaadates leidis ta MUTT Motorcycles'i.",
          originP2:
            "Ettevõtliku inimesena uuris ta tootjalt, kas piirkonnas on juba ametlik partner. Sealt hakkas kõik veerema.",
          crazies: "Leidus veel paar samasugust hulljulget.",
          startBrand:
            "Tegime ära — tõime esimesed neli ratast kohale ja hakkasime brändi esindama.",
          why: "Miks MotoRock?",
          whyP1:
            "Me võime olla väga erinevad inimesed, aga rattad ja rock'i energia on miski, mis ühendab.",
          whyP2: "Asi pole tegelikult ainult muusikas.",
          whyP3:
            "Rock on elustiil — vabadus, enesekindlus, seiklus ja julgus eristuda.",
          values: "Vabadus · Enesekindlus · Seiklus · Eristu",
          buyTitle: "Miks osta MotoRockist?",
          buyBody:
            "Erinevalt paljudest tavapärastest poodidest tahame pakkuda midagi, mis on päriselt äge.",
          dealer: "Ametlik edasimüüja",
          shopMotorcycles: "Vaata mootorrattaid →",
          getInTouch: "Võta ühendust →",
        }
      : {
          hero: {
            eyebrow: "About",
            title: "Style meets",
            accent: "adventure.",
            description:
              "We want to be the number one choice for the free and confident.",
          },
          howItStarted: "How did it all start?",
          originP1:
            "It all started simply from Tarmo's idea that he needed a cool bike for his daughter coming of age, and while browsing he came across MUTT Motorcycles.",
          originP2:
            "As an enterprising man, he asked the producers whether they already had a resale partner in the region — and that set things in motion.",
          crazies: "A couple of crazies showed up too.",
          startBrand:
            "Done and done — we brought the first four bikes here and started to represent the brand.",
          why: "Why MotoRock?",
          whyP1:
            "We can be very different as people, but bikes and rock energy have always brought us together.",
          whyP2: "Of course, it's not really about the music.",
          whyP3:
            "Rock is a lifestyle — freedom, confidence, adventure and standing out from the crowd.",
          values: "Freedom · Confidence · Adventure · Stand out",
          buyTitle: "Why buy from MotoRock?",
          buyBody:
            "Unlike most motorbike shops selling samey stuff, we want to offer something cool.",
          dealer: "Official dealer",
          shopMotorcycles: "Shop motorcycles →",
          getInTouch: "Get in touch →",
        };
  return (
    <>
      <EditorialHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        accent={t.hero.accent}
        description={t.hero.description}
      />

      <div className="overflow-hidden bg-moto">
        {/* Origin + images — floating editorial canvas */}
        <section
          aria-labelledby="about-origin"
          className="site-container relative py-16 lg:min-h-[125rem] lg:py-28"
        >
          <div
            className="pointer-events-none absolute -right-[6%] top-[14%] hidden h-[min(38vw,26rem)] w-[min(38vw,26rem)] rounded-full border border-ink/[0.07] lg:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-[6%] top-[62%] hidden h-px w-[min(24vw,14rem)] -rotate-[28deg] bg-ink/[0.09] lg:block"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute right-[8%] top-[28%] hidden max-w-[12rem] select-none text-right font-body text-[10px] font-bold uppercase leading-relaxed tracking-[0.35em] text-ink/[0.18] lg:block"
            aria-hidden="true"
          >
            Est.
            <br />
            EU
          </span>

          <div className="relative z-10 max-w-sm sm:max-w-md lg:ml-[4%] lg:max-w-lg">
            <h2 id="about-origin" className={headingClassName}>
              {t.howItStarted}
            </h2>
          </div>

          <figure className="relative z-[1] mt-10 aspect-[3/4] w-[92vw] max-w-md sm:ml-4 lg:absolute lg:right-[2%] lg:top-[4%] lg:mt-0 lg:w-[42vw] lg:max-w-none">
            <Image
              src="/aboutus1.jpg"
              alt="Motorock team with motorcycles"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 92vw, 42vw"
            />
          </figure>

          <p className="relative z-20 mt-12 max-w-md text-lg font-semibold leading-[1.65] text-ink sm:ml-10 sm:text-xl lg:mt-[22rem] lg:ml-[14%] lg:max-w-lg">
            {t.originP1}
          </p>

          <p className={`relative z-20 mt-6 max-w-md sm:max-w-sm lg:ml-[12%] lg:mt-10 lg:max-w-lg ${proseMutedClassName}`}>
            {t.originP2}
          </p>

          <p className="relative z-20 mt-10 max-w-4xl font-display text-[clamp(2.5rem,10vw,6.5rem)] font-extrabold uppercase leading-[0.88] tracking-tight text-paper mix-blend-difference lg:ml-[8%] lg:mt-20 lg:max-w-3xl">
            {t.crazies}
          </p>

          <figure className="relative z-[1] mt-14 aspect-[4/5] w-[94vw] max-w-lg sm:ml-auto sm:mr-2 lg:absolute lg:left-[-3%] lg:top-[52%] lg:mt-0 lg:w-[46vw] lg:max-w-none">
            <Image
              src="/aboutus-2.jpg"
              alt="Motorock workshop and bikes"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 94vw, 46vw"
            />
          </figure>

          <p className="relative z-20 mt-10 max-w-2xl font-display text-[clamp(1.25rem,2.8vw,2rem)] font-extrabold leading-snug tracking-tight text-ink lg:ml-auto lg:mr-[8%] lg:mt-[52rem]">
            {t.startBrand}
          </p>
        </section>

        {/* Philosophy — drifting blocks */}
        <section
          aria-labelledby="about-why"
          className="site-container relative py-16 lg:min-h-[44rem] lg:py-20"
        >
          <div
            className="pointer-events-none absolute left-[10%] top-[12%] hidden h-16 w-16 rounded-full border border-accent/15 lg:block"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -right-4 top-4 select-none font-display text-[clamp(4.5rem,13vw,8.5rem)] font-extrabold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgb(11_11_11/0.07)]"
            aria-hidden="true"
          >
            Free
          </span>
          <div
            className="pointer-events-none absolute bottom-[18%] right-[14%] hidden h-px w-[min(20vw,11rem)] rotate-[18deg] bg-ink/[0.08] lg:block"
            aria-hidden="true"
          />

          <div className="relative z-10 ml-auto max-w-sm lg:mr-[6%] lg:max-w-md">
            <h2 id="about-why" className={headingClassName}>
              {t.why}
            </h2>
          </div>

          <p className={`relative z-10 mt-8 max-w-md sm:ml-6 lg:ml-[10%] lg:mt-12 lg:max-w-xl ${proseClassName}`}>
            {t.whyP1}
          </p>

          <p className="relative z-10 mt-6 max-w-xs font-display text-xl font-extrabold uppercase leading-snug tracking-tight text-ink sm:ml-12 lg:ml-[42%] lg:mt-10 lg:max-w-sm lg:text-2xl">
            {t.whyP2}
          </p>

          <p className={`relative z-10 mt-5 ml-auto max-w-sm lg:mr-[18%] lg:mt-8 lg:max-w-md ${proseClassName}`}>
            {t.whyP3}
          </p>

          <p className="relative z-10 mt-6 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 sm:ml-16 lg:ml-[22%] lg:mt-10">
            {t.values}
          </p>

          <div className="relative z-10 mt-12 lg:absolute lg:bottom-8 lg:left-[8%] lg:mt-0">
            <Image
              src="/logo.png"
              alt="Motorock"
              width={140}
              height={44}
              className="h-8 w-auto opacity-60 sm:h-9"
            />
          </div>
        </section>

        {/* The deal — scattered list */}
        <section
          aria-labelledby="about-buy"
          className="site-container relative py-16 lg:py-28"
        >
          <div className="max-w-md lg:ml-[12%]">
            <h2 id="about-buy" className={headingClassName}>
              {t.buyTitle}
            </h2>
            <p className={`mt-5 max-w-sm ${proseClassName}`}>
              {t.buyBody}
            </p>
          </div>

          <ul className="relative mt-12 grid gap-8 md:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-10">
            {purchaseReasons.map(({ title, subtitle, body, offset, Icon }) => (
              <li key={title} className="h-full">
                <Icon
                  className="size-5 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-lg font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-xl">
                  {title}
                </h3>
                <p className="mt-1 font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
                  {subtitle}
                </p>
                <p className={`mt-2.5 ${proseMutedClassName}`}>{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Partners + CTA */}
        <section className="site-container relative pb-20 pt-8 lg:pb-28 lg:pt-12">
          <div className="lg:ml-auto lg:max-w-lg lg:text-right">
            <h2 className={headingClassName}>{t.dealer}</h2>
          </div>

          <ul className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-8 lg:mt-16 lg:gap-x-14">
            {motorcycleBrands.map((brand, index) => (
              <li
                key={brand.slug}
                className={
                  index % 3 === 1
                    ? "lg:translate-y-4"
                    : index % 3 === 2
                      ? "lg:-translate-y-2"
                      : undefined
                }
              >
                <Link
                  href={localizedHref(locale, `/shop/brands/${brand.slug}`)}
                  className="opacity-45 mix-blend-multiply transition-opacity hover:opacity-100"
                >
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={brand.width ?? 120}
                    height={brand.height ?? 36}
                    className={brand.logoClassLg}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14 flex flex-wrap gap-3 lg:ml-[18%] lg:mt-20">
            <Link
              href={localizedHref(locale, "/shop/motorcycles")}
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
            >
              {t.shopMotorcycles}
            </Link>
            <Link
              href={localizedHref(locale, "/contact")}
              className="inline-flex items-center rounded-full border border-ink/15 bg-transparent px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30"
            >
              {t.getInTouch}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
