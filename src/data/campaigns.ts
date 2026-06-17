import type { Campaign } from "@/types/campaign";

/** MotoRock Giveaway 2026 — Brixton Crossfire 500 STORR draw in Pärnu. */
export const GIVEAWAY_2026_CAMPAIGN = {
  id: "giveaway-2026",
  slug: "giveaway-2026",
  title: "MotoRock Giveaway 2026",
  shortTitle: "Win a Brixton Crossfire 500",
  activeFrom: "2026-01-01T00:00:00+02:00",
  activeUntil: "2026-09-26T23:59:59+03:00",
  minEligibleSubtotal: 100,
  productRule: "equipment-only",
  placements: ["cart-drawer", "cart-page", "checkout", "blog"],
  blogSlug: "win-a-brixton-crossfire-500-storr-motorock-giveaway-2026",
  content: {
    progressMessage:
      "Add {remaining} more in gear to enter the {title} draw",
    eligibleMessage:
      "You're in the {title} draw — 1 entry with this order",
    ctaHref:
      "/blog/win-a-brixton-crossfire-500-storr-motorock-giveaway-2026",
    ctaLabel: "Rules",
  },
} satisfies Campaign;

export const CAMPAIGNS: readonly Campaign[] = [GIVEAWAY_2026_CAMPAIGN];
