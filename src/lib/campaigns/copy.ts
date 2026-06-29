import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Campaign } from "@/types/campaign";

export type LocalizedCampaignCopy = {
  title: string;
  shortTitle: string;
  progressMessage: string;
  eligibleMessage: string;
  ctaLabel: string;
};

export function getLocalizedCampaignCopy(
  campaign: Campaign,
  dict: Dictionary,
): LocalizedCampaignCopy {
  if (campaign.id === "giveaway-2026") {
    return {
      title: dict.giveaway.giveaway2026Title,
      shortTitle: dict.giveaway.giveaway2026ShortTitle,
      progressMessage: dict.giveaway.progressMessage,
      eligibleMessage: dict.giveaway.eligibleMessage,
      ctaLabel: dict.giveaway.rules,
    };
  }

  return {
    title: campaign.title,
    shortTitle: campaign.shortTitle ?? campaign.title,
    progressMessage: campaign.content.progressMessage,
    eligibleMessage: campaign.content.eligibleMessage,
    ctaLabel: campaign.content.ctaLabel ?? dict.giveaway.rules,
  };
}

export function interpolateCampaignMessage(
  template: string,
  vars: Record<string, string>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export type CampaignLocale = Locale;
