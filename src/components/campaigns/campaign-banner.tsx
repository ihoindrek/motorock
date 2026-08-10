"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useDictionary, useLocale } from "@/context/locale-context";
import {
  GIVEAWAY_POPUP_CAMPAIGN,
  openGiveawayPopup,
} from "@/components/marketing/giveaway-popup";
import { AnimatedBorder } from "@/components/ui/animated-border";
import { localizedHref } from "@/i18n/paths";
import { localizedProductHref } from "@/lib/shop/product-url";
import { formatPrice } from "@/lib/shop/category";
import { interpolateCampaignMessage } from "@/lib/campaigns/copy";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/campaign";

const prizeLinkClassName =
  "text-inherit underline decoration-accent/45 underline-offset-2 transition-colors hover:text-accent";

function CampaignPrizeLink({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  const locale = useLocale();

  return (
    <Link
      href={localizedProductHref(slug, locale)}
      className={cn(prizeLinkClassName, className)}
    >
      {name}
    </Link>
  );
}

function CampaignDisplayTitle({ status }: { status: CampaignStatus }) {
  const { displayTitle, displayTitlePrefix, prizeName, prizeProductSlug } =
    status;

  if (prizeProductSlug && prizeName && displayTitlePrefix) {
    return (
      <>
        {displayTitlePrefix}
        <CampaignPrizeLink name={prizeName} slug={prizeProductSlug} />
      </>
    );
  }

  return displayTitle;
}

function CampaignEligibleCopy({
  status,
  eligible,
}: {
  status: CampaignStatus;
  eligible: boolean;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const {
    eligibleMessage,
    progressMessage,
    prizeName,
    prizeProductSlug,
    remaining,
  } = status;
  const message = eligible ? eligibleMessage : progressMessage;

  if (eligible && prizeProductSlug && prizeName) {
    return (
      <span className="font-medium text-ink">
        {dict.giveaway.eligibleMessageLead}
        <CampaignPrizeLink name={prizeName} slug={prizeProductSlug} />
        {dict.giveaway.eligibleMessageTail}
      </span>
    );
  }

  if (!eligible && prizeProductSlug && prizeName) {
    const before = interpolateCampaignMessage(
      dict.giveaway.progressMessageBeforePrize,
      { remaining: formatPrice(remaining, locale) },
    );

    return (
      <span className="text-ink/75">
        {before}
        <CampaignPrizeLink name={prizeName} slug={prizeProductSlug} />
        {dict.giveaway.progressMessageAfterPrize}
      </span>
    );
  }

  return (
    <span className={eligible ? "font-medium text-ink" : "text-ink/75"}>
      {message}
    </span>
  );
}

type CampaignBannerProps = {
  status: CampaignStatus;
  variant?: "compact" | "default";
  flat?: boolean;
  className?: string;
};

const GIVEAWAY_IMAGES = {
  en: GIVEAWAY_POPUP_CAMPAIGN.en,
  et: GIVEAWAY_POPUP_CAMPAIGN.et,
} as const;

function GiveawayCompactBanner({
  status,
  flat = false,
  className,
}: {
  status: CampaignStatus;
  flat?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const dict = useDictionary();
  const { campaign, isEligible, progress } = status;
  const ctaLabel = status.ctaLabel;
  const ctaHref = localizedHref(locale, campaign.content.ctaHref);
  const image = GIVEAWAY_IMAGES[locale];

  const body = (
    <>
      {!flat ? (
        <div className="flex items-center justify-between gap-2 bg-accent px-3 py-2 text-paper">
          <span className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-aggressive">
            <Gift className="size-3.5 shrink-0" aria-hidden="true" />
            {dict.giveaway.activeCampaign}
          </span>
          <span className="font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/80">
            2026
          </span>
        </div>
      ) : null}

      <div className={cn("flex gap-3 p-3.5", flat && "px-0 pt-0")}>
        <button
          type="button"
          onClick={openGiveawayPopup}
          aria-label={image.openLabel}
          className={cn(
            "relative h-[4.75rem] w-[4.25rem] shrink-0 overflow-hidden rounded-md",
            !flat &&
              "border border-accent/25 shadow-[0_8px_20px_-12px_rgba(255,104,19,0.65)] transition-transform motion-safe:active:scale-[0.98]",
          )}
        >
          <Image
            src={image.image}
            alt=""
            fill
            sizes="68px"
            className="object-cover object-center"
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-body text-base font-extrabold uppercase leading-[1.05] tracking-tight text-ink sm:text-lg">
            <CampaignDisplayTitle status={status} />
          </p>
          <p className="mt-1.5 text-sm leading-snug">
            <CampaignEligibleCopy status={status} eligible={isEligible} />
          </p>
        </div>
      </div>

      {!isEligible ? (
        <div className={cn("px-3.5 pb-1", flat && "px-0")}>
          <div className="mb-1.5 flex justify-between font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            <span>{dict.giveaway.progress}</span>
            <span className="tabular-nums text-accent">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={dict.giveaway.campaignProgressAria}
          >
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-accent/80 to-accent",
                !flat && "transition-[width] duration-300 motion-reduce:transition-none",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className={cn("p-3.5 pt-2", flat && "px-0 pb-0", isEligible && flat && "pt-3", !isEligible && flat && "pt-2")}>
        <Link
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent flex w-full justify-center py-2.5 text-[11px] tracking-aggressive"
        >
          {ctaLabel} →
        </Link>
      </div>
    </>
  );

  if (flat) {
    return <div className={cn("overflow-hidden", className)}>{body}</div>;
  }

  return (
    <AnimatedBorder
      className={cn(
        "shadow-[0_16px_40px_-20px_rgba(255,104,19,0.55),0_8px_24px_-12px_rgba(11,11,11,0.12)]",
        className,
      )}
      lightColor="#FF6813"
      backgroundColor="#FFF0E6"
      borderWidth={2}
      duration={2.1}
      lightWidth={132}
      contentClassName="overflow-hidden rounded-sm bg-gradient-to-br from-accent/[0.14] via-[#fff7f1] to-paper"
    >
      {body}
    </AnimatedBorder>
  );
}

export function CampaignBanner({
  status,
  variant = "default",
  flat = false,
  className,
}: CampaignBannerProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const { campaign, isEligible, progress } = status;
  const ctaLabel = status.ctaLabel;
  const ctaHref = localizedHref(locale, campaign.content.ctaHref);

  if (variant === "compact") {
    return (
      <GiveawayCompactBanner status={status} flat={flat} className={className} />
    );
  }

  return (
    <AnimatedBorder
      className={cn(
        "shadow-[0_16px_40px_-20px_rgba(255,104,19,0.45),0_8px_24px_-12px_rgba(11,11,11,0.1)]",
        className,
      )}
      lightColor="#FF6813"
      backgroundColor="#FFF0E6"
      borderWidth={2}
      duration={2.25}
      lightWidth={148}
      contentClassName="rounded-sm bg-gradient-to-br from-accent/[0.1] via-paper to-paper px-5 py-4 sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
            {dict.giveaway.activeCampaign}
          </p>
          <p className="mt-1 font-body text-base font-extrabold uppercase tracking-tight text-ink sm:text-lg">
            <CampaignDisplayTitle status={status} />
          </p>
        </div>
        <Link
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
        >
          {ctaLabel} →
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed sm:text-base">
        <CampaignEligibleCopy status={status} eligible={isEligible} />
      </p>
      {!isEligible ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            <span>{dict.giveaway.progress}</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={dict.giveaway.campaignProgressAria}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </AnimatedBorder>
  );
}
