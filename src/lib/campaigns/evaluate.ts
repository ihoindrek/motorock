import type { CartLine } from "@/context/cart-context";
import { CAMPAIGNS } from "@/data/campaigns";
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

function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
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

export function evaluateCampaign(
  lines: readonly CartLine[],
  campaign: Campaign,
): CampaignStatus {
  const eligibleSubtotal = lines
    .filter((line) => isLineEligible(line, campaign.productRule))
    .reduce((sum, line) => sum + line.price * line.quantity, 0);

  const remaining = Math.max(
    0,
    campaign.minEligibleSubtotal - eligibleSubtotal,
  );
  const isEligible = eligibleSubtotal >= campaign.minEligibleSubtotal;
  const progress =
    campaign.minEligibleSubtotal === 0
      ? 100
      : Math.min(
          100,
          (eligibleSubtotal / campaign.minEligibleSubtotal) * 100,
        );

  const title = campaign.shortTitle ?? campaign.title;
  const vars = {
    remaining: formatPrice(remaining),
    title,
    min: formatPrice(campaign.minEligibleSubtotal),
  };

  return {
    campaign,
    eligibleSubtotal,
    isEligible,
    remaining,
    progress,
    progressMessage: interpolate(campaign.content.progressMessage, vars),
    eligibleMessage: interpolate(campaign.content.eligibleMessage, vars),
  };
}

export function getCampaignStatuses(
  lines: readonly CartLine[],
  placement: CampaignPlacement,
  now = Date.now(),
): CampaignStatus[] {
  return getActiveCampaigns(now)
    .filter((campaign) => campaign.placements.includes(placement))
    .map((campaign) => evaluateCampaign(lines, campaign));
}
