import type { CartLine } from "@/context/cart-context";
import { CAMPAIGNS } from "@/data/campaigns";
import {
  getLocalizedCampaignCopy,
  interpolateCampaignMessage,
  type CampaignLocale,
} from "@/lib/campaigns/copy";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatPrice } from "@/lib/shop/category";
import type {
  Campaign,
  CampaignPlacement,
  CampaignProductRule,
  CampaignStatus,
} from "@/types/campaign";

function isLineEligible(
  line: CartLine,
  rule: CampaignProductRule,
): boolean {
  if (rule === "equipment-only") {
    return line.type !== "motorcycle";
  }

  return true;
}

export function isCampaignActive(
  campaign: Campaign,
  now = Date.now(),
): boolean {
  return (
    now >= new Date(campaign.activeFrom).getTime() &&
    now <= new Date(campaign.activeUntil).getTime()
  );
}

export function getActiveCampaigns(now = Date.now()): Campaign[] {
  return CAMPAIGNS.filter((campaign) => isCampaignActive(campaign, now));
}

export function countGiveawayEntriesForAmount(
  amount: number,
  minEligibleSubtotal = 100,
): number {
  if (amount < minEligibleSubtotal) {
    return 0;
  }

  return Math.floor(amount / minEligibleSubtotal);
}

export function getGiveawayProductCampaign(now = Date.now()): Campaign | undefined {
  return getActiveCampaigns(now).find((campaign) =>
    campaign.placements.includes("product-detail"),
  );
}

export function evaluateCampaign(
  lines: readonly CartLine[],
  campaign: Campaign,
  locale: CampaignLocale,
  dict: Dictionary,
): CampaignStatus {
  const eligibleSubtotal = lines
    .filter((line) => isLineEligible(line, campaign.productRule))
    .reduce((sum, line) => sum + line.price * line.quantity, 0);

  const remaining = Math.max(
    0,
    campaign.minEligibleSubtotal - eligibleSubtotal,
  );
  const isEligible = eligibleSubtotal >= campaign.minEligibleSubtotal;
  const entryCount = isEligible
    ? Math.max(
        1,
        Math.floor(eligibleSubtotal / campaign.minEligibleSubtotal),
      )
    : 0;
  const progress =
    campaign.minEligibleSubtotal === 0
      ? 100
      : Math.min(
          100,
          (eligibleSubtotal / campaign.minEligibleSubtotal) * 100,
        );

  const copy = getLocalizedCampaignCopy(campaign, dict);
  const title = copy.shortTitle;
  const prizeName = copy.prizeName ?? title;
  const vars = {
    remaining: formatPrice(remaining, locale),
    title,
    prizeName,
    min: formatPrice(campaign.minEligibleSubtotal, locale),
  };

  return {
    campaign,
    eligibleSubtotal,
    isEligible,
    remaining,
    progress,
    entryCount,
    progressMessage: interpolateCampaignMessage(copy.progressMessage, vars),
    eligibleMessage: interpolateCampaignMessage(copy.eligibleMessage, vars),
    displayTitle: copy.shortTitle,
    displayTitlePrefix: copy.shortTitlePrefix ?? null,
    prizeName: copy.prizeName ?? null,
    prizeProductSlug: campaign.prizeProductSlug ?? null,
    ctaLabel: copy.ctaLabel,
  };
}

export function getCampaignStatuses(
  lines: readonly CartLine[],
  placement: CampaignPlacement,
  locale: CampaignLocale,
  dict: Dictionary,
  now = Date.now(),
): CampaignStatus[] {
  return getActiveCampaigns(now)
    .filter((campaign) => campaign.placements.includes(placement))
    .map((campaign) => evaluateCampaign(lines, campaign, locale, dict));
}
