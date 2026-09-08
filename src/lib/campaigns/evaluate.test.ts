import { describe, expect, it } from "vitest";
import { evaluateCampaign } from "@/lib/campaigns/evaluate";
import { GIVEAWAY_2026_CAMPAIGN } from "@/data/campaigns";
import { en } from "@/i18n/dictionaries/en";

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
