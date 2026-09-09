"use client";

import Link from "next/link";
import { Gift, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  const lineText =
    entryCount === 0
      ? dict.giveaway.productEntryInlineNeedMore.replace(
          "{remaining}",
          formatPrice(remaining, locale),
        )
      : entryCount === 1
        ? dict.giveaway.productEntryInlineOne
        : dict.giveaway.productEntryInlineMany.replace(
            "{count}",
            String(entryCount),
          );

  return (
    <TooltipProvider delayDuration={150}>
      <p
        className={cn(
          "flex min-w-0 items-center gap-2 text-[11px] leading-snug text-ink/55",
          className,
        )}
      >
        <Gift
          className="size-3.5 shrink-0 text-ink/40"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="min-w-0 font-medium text-ink/65">{lineText}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={dict.giveaway.productEntryInfoAria}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:text-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Info className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-[16rem] border-ink/10 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-ink/70 shadow-[0_8px_24px_rgb(11_11_11_/_0.12)]"
          >
            <p>{dict.giveaway.entryRuleSummary}</p>
            <p className="mt-1.5">{dict.giveaway.productEntryStackHint}</p>
            <Link
              href={giveawayHref}
              className="mt-2 inline-block font-medium text-ink underline decoration-ink/25 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/40"
            >
              {dict.giveaway.rules} →
            </Link>
          </TooltipContent>
        </Tooltip>
      </p>
    </TooltipProvider>
  );
}
