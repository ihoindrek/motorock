import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { SHOWROOM } from "@/data/showroom";
import { getGooglePlacesApiKey } from "@/lib/google/places-api-key";
import {
  isEnglishLanguageCode,
  isEstonianLanguageCode,
  translateGoogleText,
} from "@/lib/google/translate-google-text";

const PLACE_DETAILS_FIELD_MASK =
  "id,displayName,rating,userRatingCount,reviews";
const REVIEWS_CACHE_SECONDS = 86_400;
const MAX_REVIEWS = 5;
const MAX_REVIEW_CHARS = 320;

type PlacesLocalizedText = {
  text?: string;
  languageCode?: string;
};

type PlacesApiReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  text?: PlacesLocalizedText;
  originalText?: PlacesLocalizedText;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

type PlacesApiPlace = {
  id?: string;
  displayName?: PlacesLocalizedText;
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesApiReview[];
};

type MergedReviewDraft = {
  publishTime: string;
  rating: number;
  authorName: string;
  authorPhotoUrl?: string;
  authorProfileUrl?: string;
  textEn: string;
  textEnLang?: string;
  textEt: string;
  textEtLang?: string;
  relativeTimeEn: string;
  relativeTimeEt: string;
};

export type ShowroomGoogleReview = {
  authorName: string;
  authorPhotoUrl?: string;
  authorProfileUrl?: string;
  rating: number;
  relativeTime: string;
  relativeTimeEn: string;
  relativeTimeEt: string;
  textEn: string;
  textEt: string;
  publishTime: string;
};

export type ShowroomGoogleReviews = {
  placeId: string;
  displayName: string;
  rating: number;
  reviewCount: number;
  reviews: ShowroomGoogleReview[];
};

export function pickLocalizedReviewText(
  review: Pick<ShowroomGoogleReview, "textEn" | "textEt">,
  locale: Locale,
): string {
  return locale === "et" ? review.textEt : review.textEn;
}

export function pickLocalizedReviewTime(
  review: Pick<ShowroomGoogleReview, "relativeTimeEn" | "relativeTimeEt">,
  locale: Locale,
): string {
  return locale === "et" ? review.relativeTimeEt : review.relativeTimeEn;
}

export function truncateReviewText(text: string, maxChars = MAX_REVIEW_CHARS) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}…`;
}

function extractReviewText(review: PlacesApiReview) {
  return review.text?.text?.trim() || review.originalText?.text?.trim() || "";
}

function extractReviewLanguage(review: PlacesApiReview) {
  return (
    review.text?.languageCode?.toLowerCase() ||
    review.originalText?.languageCode?.toLowerCase() ||
    undefined
  );
}

function reviewKey(review: PlacesApiReview) {
  return review.publishTime?.trim() || review.authorAttribution?.displayName?.trim() || "";
}

function upsertReviewDraft(
  map: Map<string, MergedReviewDraft>,
  review: PlacesApiReview,
  languageCode: "en" | "et",
) {
  const key = reviewKey(review);
  const authorName = review.authorAttribution?.displayName?.trim();
  const rating = review.rating;
  const publishTime = review.publishTime?.trim();
  const relativeTime = review.relativePublishTimeDescription?.trim();
  const text = extractReviewText(review);
  const textLang = extractReviewLanguage(review);

  if (!key || !authorName || !rating || !publishTime || !relativeTime) {
    return;
  }

  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      publishTime,
      rating,
      authorName,
      authorPhotoUrl: review.authorAttribution?.photoUri?.trim() || undefined,
      authorProfileUrl: review.authorAttribution?.uri?.trim() || undefined,
      textEn: languageCode === "en" ? text : "",
      textEnLang: languageCode === "en" ? textLang : undefined,
      textEt: languageCode === "et" ? text : "",
      textEtLang: languageCode === "et" ? textLang : undefined,
      relativeTimeEn: languageCode === "en" ? relativeTime : "",
      relativeTimeEt: languageCode === "et" ? relativeTime : "",
    });
    return;
  }

  if (languageCode === "en") {
    existing.textEn = text || existing.textEn;
    existing.textEnLang = textLang || existing.textEnLang;
    existing.relativeTimeEn = relativeTime || existing.relativeTimeEn;
  } else {
    existing.textEt = text || existing.textEt;
    existing.textEtLang = textLang || existing.textEtLang;
    existing.relativeTimeEt = relativeTime || existing.relativeTimeEt;
  }

  existing.authorPhotoUrl =
    existing.authorPhotoUrl || review.authorAttribution?.photoUri?.trim() || undefined;
  existing.authorProfileUrl =
    existing.authorProfileUrl || review.authorAttribution?.uri?.trim() || undefined;
}

async function localizeReviewDraft(
  draft: MergedReviewDraft,
): Promise<MergedReviewDraft> {
  let textEn = draft.textEn.trim();
  let textEt = draft.textEt.trim();

  const needsEnglish =
    !textEn ||
    isEstonianLanguageCode(draft.textEnLang) ||
    (textEt && textEn === textEt);

  const needsEstonian =
    !textEt ||
    isEnglishLanguageCode(draft.textEtLang) ||
    (textEn && textEn === textEt);

  if (needsEnglish && textEt) {
    const translated = await translateGoogleText(textEt, "en", "et");
    if (translated) {
      textEn = translated;
    } else if (!textEn) {
      textEn = textEt;
    }
  }

  if (needsEstonian && textEn) {
    const translated = await translateGoogleText(textEn, "et", "en");
    if (translated) {
      textEt = translated;
    } else if (!textEt) {
      textEt = textEn;
    }
  }

  if (!textEn && textEt) {
    textEn = textEt;
  }

  if (!textEt && textEn) {
    textEt = textEn;
  }

  return {
    ...draft,
    textEn,
    textEt,
    relativeTimeEn: draft.relativeTimeEn || draft.relativeTimeEt,
    relativeTimeEt: draft.relativeTimeEt || draft.relativeTimeEn,
  };
}

export function mapMergedReviewDraft(
  draft: MergedReviewDraft,
): ShowroomGoogleReview | null {
  if (!draft.textEn.trim() && !draft.textEt.trim()) {
    return null;
  }

  return {
    authorName: draft.authorName,
    authorPhotoUrl: draft.authorPhotoUrl,
    authorProfileUrl: draft.authorProfileUrl,
    rating: draft.rating,
    relativeTime: draft.relativeTimeEn || draft.relativeTimeEt,
    relativeTimeEn: draft.relativeTimeEn || draft.relativeTimeEt,
    relativeTimeEt: draft.relativeTimeEt || draft.relativeTimeEn,
    textEn: truncateReviewText(draft.textEn),
    textEt: truncateReviewText(draft.textEt),
    publishTime: draft.publishTime,
  };
}

async function fetchPlacePayload(
  languageCode: "en" | "et",
): Promise<PlacesApiPlace | null> {
  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${SHOWROOM.googlePlaceId}?languageCode=${languageCode}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
      },
      next: { revalidate: REVIEWS_CACHE_SECONDS },
    },
  );

  if (!response.ok) {
    console.error(
      `[google-reviews] Places API error (${languageCode}):`,
      response.status,
      await response.text(),
    );
    return null;
  }

  return (await response.json()) as PlacesApiPlace;
}

async function fetchShowroomReviewsUncached(): Promise<ShowroomGoogleReviews | null> {
  const [enPayload, etPayload] = await Promise.all([
    fetchPlacePayload("en"),
    fetchPlacePayload("et"),
  ]);

  const payload = enPayload ?? etPayload;

  if (!payload) {
    return null;
  }

  const rating = payload.rating ?? enPayload?.rating ?? etPayload?.rating;
  const reviewCount =
    payload.userRatingCount ??
    enPayload?.userRatingCount ??
    etPayload?.userRatingCount;

  if (rating == null || reviewCount == null || reviewCount < 1) {
    return null;
  }

  const merged = new Map<string, MergedReviewDraft>();

  for (const review of enPayload?.reviews ?? []) {
    upsertReviewDraft(merged, review, "en");
  }

  for (const review of etPayload?.reviews ?? []) {
    upsertReviewDraft(merged, review, "et");
  }

  const localizedDrafts = await Promise.all(
    [...merged.values()].map((draft) => localizeReviewDraft(draft)),
  );

  const reviews = localizedDrafts
    .map(mapMergedReviewDraft)
    .filter((review): review is ShowroomGoogleReview => review !== null)
    .slice(0, MAX_REVIEWS);

  if (reviews.length === 0) {
    return null;
  }

  return {
    placeId: payload.id ?? SHOWROOM.googlePlaceId,
    displayName: payload.displayName?.text?.trim() || "Motorock",
    rating,
    reviewCount,
    reviews,
  };
}

export const getShowroomGoogleReviews = unstable_cache(
  fetchShowroomReviewsUncached,
  ["motorock-showroom-google-reviews-v3"],
  {
    revalidate: REVIEWS_CACHE_SECONDS,
    tags: ["google-reviews"],
  },
);

/** @deprecated Used by tests mapping raw Places API payloads. */
export function mapPlacesApiReview(review: PlacesApiReview) {
  const authorName = review.authorAttribution?.displayName?.trim();
  const rating = review.rating;
  const relativeTime = review.relativePublishTimeDescription?.trim();
  const publishTime = review.publishTime?.trim();
  const translated = review.text?.text?.trim() ?? "";
  const original = review.originalText?.text?.trim() ?? "";
  const originalLang = review.originalText?.languageCode?.toLowerCase() ?? "";

  if (!authorName || !rating || !relativeTime || !publishTime) {
    return null;
  }

  const textEn =
    originalLang.startsWith("et")
      ? isEnglishLanguageCode(review.text?.languageCode)
        ? translated
        : ""
      : translated || original;
  const textEt =
    originalLang.startsWith("et")
      ? original || translated
      : isEstonianLanguageCode(review.text?.languageCode)
        ? translated
        : original || translated;

  if (!textEn.trim() && !textEt.trim()) {
    return null;
  }

  return {
    authorName,
    authorPhotoUrl: review.authorAttribution?.photoUri?.trim() || undefined,
    authorProfileUrl: review.authorAttribution?.uri?.trim() || undefined,
    rating,
    relativeTime,
    relativeTimeEn: relativeTime,
    relativeTimeEt: relativeTime,
    textEn: truncateReviewText(textEn),
    textEt: truncateReviewText(textEt),
    publishTime,
  };
}
