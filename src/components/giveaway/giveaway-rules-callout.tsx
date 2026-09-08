import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

type GiveawayRulesCalloutProps = {
  locale: Locale;
  shopLabel: string;
};

export function GiveawayRulesCallout({
  locale,
  shopLabel,
}: GiveawayRulesCalloutProps) {
  const dict = getDictionary(locale);
  const shopHref = localizedHref(locale, buildEquipmentHubHref(locale));

  return (
    <aside
      aria-labelledby="giveaway-rules-headline"
      className="mb-10 rounded-sm border-2 border-accent bg-gradient-to-br from-accent/[0.12] via-paper to-paper p-6 sm:mb-12 sm:p-8"
    >
      <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
        {dict.giveaway.howItWorksTitle}
      </p>
      <h2
        id="giveaway-rules-headline"
        className="mt-2 font-body text-[clamp(1.5rem,4.5vw,2.25rem)] font-extrabold leading-[1.05] tracking-tight text-ink"
      >
        {dict.giveaway.entryHeadline}
      </h2>
      <p className="mt-3 text-base font-medium leading-relaxed text-ink/80 sm:text-lg">
        {dict.giveaway.entryNoForms}
      </p>
      <p className="mt-2 font-body text-sm font-bold uppercase tracking-aggressive text-accent">
        {dict.giveaway.entryExamples}
      </p>
      <ol className="mt-5 space-y-2.5 border-t border-ink/10 pt-5">
        {[
          dict.giveaway.howItWorksStep1,
          dict.giveaway.howItWorksStep2,
          dict.giveaway.howItWorksStep3,
        ].map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-snug text-ink/80">
            <span
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent font-body text-[11px] font-extrabold text-paper"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <Link href={shopHref} className="btn-accent mt-6 inline-flex">
        {shopLabel}
      </Link>
    </aside>
  );
}
