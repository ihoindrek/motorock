import { describe, expect, it } from "vitest";
import {
  mapMergedReviewDraft,
  mapPlacesApiReview,
  pickLocalizedReviewText,
  pickLocalizedReviewTime,
  truncateReviewText,
} from "@/lib/google/fetch-showroom-reviews";

describe("truncateReviewText", () => {
  it("truncates long review copy with an ellipsis", () => {
    const text = "A".repeat(400);

    expect(truncateReviewText(text, 320)).toBe(`${"A".repeat(320)}…`);
  });
});

describe("mapPlacesApiReview", () => {
  it("maps Places API review payload", () => {
    const review = mapPlacesApiReview({
      rating: 5,
      relativePublishTimeDescription: "3 weeks ago",
      publishTime: "2026-07-23T12:51:25.991956839Z",
      text: {
        text: "Great place and knowledgeable guys!",
        languageCode: "en-US",
      },
      originalText: {
        text: "Super koht ja teadjad mehed!",
        languageCode: "et",
      },
      authorAttribution: {
        displayName: "Janek Samberg",
        uri: "https://www.google.com/maps/contrib/117018863081192248711/reviews",
      },
    });

    expect(review).toMatchObject({
      authorName: "Janek Samberg",
      rating: 5,
      textEn: "Great place and knowledgeable guys!",
      textEt: "Super koht ja teadjad mehed!",
    });
  });
});

describe("mapMergedReviewDraft", () => {
  it("stores localized EN and ET review copy", () => {
    const review = mapMergedReviewDraft({
      publishTime: "2026-05-15T10:37:46.411433529Z",
      rating: 5,
      authorName: "Sten Tristan Laur",
      textEn: "Super shop. Very different motorcycles and clothing.",
      textEt: "Super pood. Väga teistsugused mootorrattad ja riided.",
      relativeTimeEn: "3 months ago",
      relativeTimeEt: "3 kuud tagasi",
    });

    expect(review).toMatchObject({
      textEn: "Super shop. Very different motorcycles and clothing.",
      textEt: "Super pood. Väga teistsugused mootorrattad ja riided.",
      relativeTimeEn: "3 months ago",
      relativeTimeEt: "3 kuud tagasi",
    });
  });
});

describe("pickLocalizedReviewText", () => {
  it("returns Estonian copy on ET locale", () => {
    expect(
      pickLocalizedReviewText(
        {
          textEn: "Great place",
          textEt: "Super koht",
        },
        "et",
      ),
    ).toBe("Super koht");
  });

  it("returns English copy on EN locale", () => {
    expect(
      pickLocalizedReviewText(
        {
          textEn: "Great place",
          textEt: "Super koht",
        },
        "en",
      ),
    ).toBe("Great place");
  });
});

describe("pickLocalizedReviewTime", () => {
  it("returns localized relative time", () => {
    expect(
      pickLocalizedReviewTime(
        {
          relativeTimeEn: "3 months ago",
          relativeTimeEt: "3 kuud tagasi",
        },
        "et",
      ),
    ).toBe("3 kuud tagasi");
  });
});
