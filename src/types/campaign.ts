export type CampaignPlacement =
  | "cart-drawer"
  | "cart-page"
  | "checkout"
  | "blog"
  | "header-nav"
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
  blogSlugs?: Partial<Record<"en" | "et", string>>;
  /** Loosiauhinna toote slug (nt `/toode/{slug}`). */
  prizeProductSlug?: string;
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
  displayTitlePrefix?: string | null;
  prizeName?: string | null;
  prizeProductSlug?: string | null;
  ctaLabel: string;
};
