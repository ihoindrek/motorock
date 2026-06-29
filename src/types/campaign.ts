export type CampaignPlacement =
  | "cart-drawer"
  | "cart-page"
  | "checkout"
  | "blog"
  | "site-banner";

export type CampaignProductRule = "equipment-only" | "all";

export type Campaign = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  activeFrom: string;
  activeUntil: string;
  minEligibleSubtotal: number;
  productRule: CampaignProductRule;
  placements: CampaignPlacement[];
  blogSlug?: string;
  content: {
    progressMessage: string;
    eligibleMessage: string;
    ctaHref: string;
    ctaLabel?: string;
  };
};

export type CampaignStatus = {
  campaign: Campaign;
  eligibleSubtotal: number;
  isEligible: boolean;
  remaining: number;
  progress: number;
  progressMessage: string;
  eligibleMessage: string;
  displayTitle: string;
  ctaLabel: string;
};
