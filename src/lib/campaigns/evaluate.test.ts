import { describe, expect, it } from "vitest";
import {
  countGiveawayEntriesForAmount,
  evaluateCampaign,
} from "@/lib/campaigns/evaluate";
import { GIVEAWAY_2026_CAMPAIGN } from "@/data/campaigns";
import { en } from "@/i18n/dictionaries/en";

describe("countGiveawayEntriesForAmount", () => {
  it("returns zero below the minimum threshold", () => {
    expect(countGiveawayEntriesForAmount(99)).toBe(0);
    expect(countGiveawayEntriesForAmount(0)).toBe(0);
  });

  it("returns one entry per full €100", () => {
    expect(countGiveawayEntriesForAmount(100)).toBe(1);
    expect(countGiveawayEntriesForAmount(199)).toBe(1);
    expect(countGiveawayEntriesForAmount(200)).toBe(2);
    expect(countGiveawayEntriesForAmount(350)).toBe(3);
  });
});

describe("evaluateCampaign", () => {
  it("counts draw entries from eligible equipment subtotal", () => {
    const status = evaluateCampaign(
      [
        {
          slug: "jacket",
          name: "Jacket",
          price: 120,
          quantity: 2,
          type: "equipment",
          image: "/jacket.webp",
          brand: "Test",
        },
      ],
      GIVEAWAY_2026_CAMPAIGN,
      "en",
      en,
    );

    expect(status.isEligible).toBe(true);
    expect(status.entryCount).toBe(2);
  });
});
