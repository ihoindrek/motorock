import Image from "next/image";
import Link from "next/link";
import { RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { EditorialHero } from "@/components/content/editorial-hero";
import { brands } from "@/data/brands";

const purchaseReasons: readonly {
  title: string;
  subtitle: string;
  body: string;
  offset: string;
  Icon: LucideIcon;
}[] = [
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
];

const motorcycleBrands = brands.filter(
  (brand): brand is typeof brand & { logo: string } => Boolean(brand.logo),
);

const proseClassName =
  "text-base font-medium leading-[1.7] text-ink sm:text-lg";
const proseMutedClassName =
  "text-base font-medium leading-[1.7] text-ink/85 sm:text-lg";

const headingClassName =
  "font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink";

export function AboutView() {
  return (
    <>
      <EditorialHero
        eyebrow="About"
        title="Style meets"
        accent="adventure."
        description="We want to be the number one choice for the free and confident."
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
            className="pointer-events-none absolute right-[8%] top-[28%] hidden max-w-[12rem] select-none text-right font-display text-[10px] font-bold uppercase leading-relaxed tracking-[0.35em] text-ink/[0.18] lg:block"
            aria-hidden="true"
          >
            Est.
            <br />
            EU
          </span>

          <div className="relative z-10 max-w-sm sm:max-w-md lg:ml-[4%] lg:max-w-lg">
            <h2 id="about-origin" className={headingClassName}>
              How did it
              <br />
              all start?
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
            It all started simply from Tarmo&apos;s idea that he needed a cool
            bike for his daughter who was coming of age, and while browsing the
            web he came across MUTT Motorcycles. Since Tarmo is not a jealous
            person at all, he thought that maybe there are some people in the
            area who might be interested in such vehicles.
          </p>

          <p className={`relative z-20 mt-6 max-w-md sm:max-w-sm lg:ml-[12%] lg:mt-10 lg:max-w-lg ${proseMutedClassName}`}>
            As an enterprising man, he asked the producers on the ground
            whether or not they already had a partner with resale rights in
            Marjumaa. Tarmo shouted loudly in a village square on Facebook that
            he was looking for partners.
          </p>

          <p className="relative z-20 mt-10 max-w-4xl font-display text-[clamp(2.5rem,10vw,6.5rem)] font-extrabold uppercase leading-[0.88] tracking-tight text-paper mix-blend-difference lg:ml-[8%] lg:mt-20 lg:max-w-3xl">
            A couple of crazies showed up too.
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
            Done and done — we brought the first four bikes here and started to
            represent the brand.
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
              Why MotoRock?
            </h2>
          </div>

          <p className={`relative z-10 mt-8 max-w-md sm:ml-6 lg:ml-[10%] lg:mt-12 lg:max-w-xl ${proseClassName}`}>
            We can be very different as people. Living in the city or the
            countryside, doing our daily work with a bell and a hammer, a mouse
            and a keyboard, or an oil pan in the garage. One thing is clear —
            from the very beginning, none of us has been indifferent to bikes,
            and rock music always gets most of us on our feet.
          </p>

          <p className="relative z-10 mt-6 max-w-xs font-display text-xl font-extrabold uppercase leading-snug tracking-tight text-ink sm:ml-12 lg:ml-[42%] lg:mt-10 lg:max-w-sm lg:text-2xl">
            Of course, it&apos;s not really about the music.
          </p>

          <p className={`relative z-10 mt-5 ml-auto max-w-sm lg:mr-[18%] lg:mt-8 lg:max-w-md ${proseClassName}`}>
            Rock is a lifestyle — freedom, confidence, adventure and standing
            out from the crowd.
          </p>

          <p className="relative z-10 mt-6 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45 sm:ml-16 lg:ml-[22%] lg:mt-10">
            Freedom · Confidence · Adventure · Stand out
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
              Why buy from MotoRock?
            </h2>
            <p className={`mt-5 max-w-sm ${proseClassName}`}>
              Unlike most motorbike shops on the market today, which sell
              relatively bland and samey stuff, we want to offer{" "}
              <span className="font-extrabold text-accent">something cool.</span>
            </p>
          </div>

          <ul className="relative mt-12 space-y-12 lg:mt-16 lg:space-y-14">
            {purchaseReasons.map(({ title, subtitle, body, offset, Icon }) => (
              <li key={title} className={`max-w-xs sm:max-w-sm lg:max-w-md ${offset}`}>
                <Icon
                  className="size-5 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-lg font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-xl">
                  {title}
                </h3>
                <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
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
            <h2 className={headingClassName}>Official dealer</h2>
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
                  href={`/shop/brands/${brand.slug}`}
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
              href="/shop/motorcycles"
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
            >
              Shop motorcycles →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-ink/15 bg-transparent px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30"
            >
              Get in touch →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
