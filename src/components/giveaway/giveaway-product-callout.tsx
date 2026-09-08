"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useDictionary, useLocale } from "@/context/locale-context";
import {
  countGiveawayEntriesForAmount,
  getGiveawayProductCampaign,
} from "@/lib/campaigns/evaluate";
import { localizedHref } from "@/i18n/paths";
import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";

type GiveawayProductCalloutProps = {
  price: number;
  className?: string;
};

export function GiveawayProductCallout({
  price,
  className,
}: GiveawayProductCalloutProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const campaign = getGiveawayProductCampaign();

  if (!campaign) {
    return null;
  }

  const entryCount = countGiveawayEntriesForAmount(
    price,
    campaign.minEligibleSubtotal,
  );
  const remaining = Math.max(0, campaign.minEligibleSubtotal - price);
  const slug = campaign.blogSlugs?.[locale] ?? campaign.blogSlug;
  const giveawayHref = slug
    ? localizedHref(locale, `/blog/${slug}`)
    : localizedHref(locale, campaign.content.ctaHref);

  const entryDetail =
    entryCount === 0
      ? null
      : entryCount === 1
        ? dict.giveaway.productEntryCountOne
        : dict.giveaway.productEntryCountMany.replace(
            "{count}",
            String(entryCount),
          );

  const headline =
    entryCount === 0
      ? dict.giveaway.productEntryNeedMore.replace(
          "{remaining}",
          formatPrice(remaining, locale),
        )
      : dict.giveaway.productEntryHeadline;

  return (
    <aside
      aria-labelledby="giveaway-product-callout-title"
      className={cn("rounded-sm border border-ink/10 p-4", className)}
    >
      <div>
        <p
          id="giveaway-product-callout-title"
          className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-aggressive text-accent"
        >
          <Gift className="size-3.5 shrink-0" aria-hidden="true" />
          {dict.giveaway.productGiveawayTitle}
        </p>
        <p className="mt-1.5 font-body text-base font-extrabold leading-snug text-ink">
          {headline}
        </p>
        {entryDetail ? (
          <p className="mt-1 text-sm font-medium text-accent">{entryDetail}</p>
        ) : null}
        <p className="mt-1.5 text-xs leading-relaxed text-ink/55">
          {dict.giveaway.productEntryStackHint}{" "}
          <Link
            href={giveawayHref}
            className="font-medium text-ink/45 underline decoration-ink/20 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/40"
          >
            {dict.giveaway.rules} →
          </Link>
        </p>
      </div>
    </aside>
  );
}
