import type { Locale } from "@/i18n/config";
import {
  SHOWROOM_GOOGLE_MAPS_URL,
  SHOWROOM_GOOGLE_WRITE_REVIEW_URL,
} from "@/data/showroom";
import {
  pickLocalizedReviewText,
  pickLocalizedReviewTime,
  type ShowroomGoogleReviews,
} from "@/lib/google/fetch-showroom-reviews";
import {
  DesignTestimonial,
  type DesignTestimonialItem,
} from "@/components/ui/design-testimonial";
import { GoogleIcon } from "@/components/ui/google-icon";

type GoogleReviewsPanelProps = {
  locale: Locale;
  reviews: ShowroomGoogleReviews;
};

const copy = {
  en: {
    eyebrow: "Reviews",
    eyebrowLabel: "Google reviews",
    title: "What riders say",
    readAllPrefix: "Read on",
    readAllSuffix: "Maps",
    readAllLabel: "Read on Google Maps",
    writeReview: "Leave a review",
    carouselLabel: "Reviews",
  },
  et: {
    eyebrow: "Arvustused",
    eyebrowLabel: "Google'i arvustused",
    title: "Mida sõitjad ütlevad",
    readAllPrefix: "Loe",
    readAllSuffix: "Maps'is",
    readAllLabel: "Loe Google Mapsis",
    writeReview: "Jäta arvustus",
    carouselLabel: "Arvustused",
  },
} as const;

function truncateWords(text: string, maxWords = 32) {
  const words = text.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  return `${words.slice(0, maxWords).join(" ")}…`;
}

function mapReviewsToDesignTestimonials(
  reviews: ShowroomGoogleReviews,
  locale: Locale,
): DesignTestimonialItem[] {
  return reviews.reviews.map((review) => ({
    id: review.publishTime,
    quote: truncateWords(pickLocalizedReviewText(review, locale)),
    author: review.authorName,
    role: pickLocalizedReviewTime(review, locale),
    rating: review.rating,
    avatar: review.authorPhotoUrl,
  }));
}

export function GoogleReviewsPanel({ locale, reviews }: GoogleReviewsPanelProps) {
  const t = copy[locale];
  const items = mapReviewsToDesignTestimonials(reviews, locale);

  return (
    <section
      aria-labelledby="google-reviews-heading"
      className="border-t border-ink/10 bg-white py-14 lg:py-20"
    >
      <div className="site-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className="section-eyebrow inline-flex items-center gap-1.5 text-accent"
              aria-label={t.eyebrowLabel}
            >
              <GoogleIcon className="size-3.5 shrink-0" />
              <span>{t.eyebrow}</span>
            </p>
            <h2
              id="google-reviews-heading"
              className="mt-2 text-2xl font-extrabold uppercase text-ink sm:text-3xl"
            >
              {t.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={SHOWROOM_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.readAllLabel}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface"
            >
              <span>{t.readAllPrefix}</span>
              <GoogleIcon className="size-3.5 shrink-0" />
              <span>{t.readAllSuffix}</span>
            </a>
            <a
              href={SHOWROOM_GOOGLE_WRITE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
            >
              {t.writeReview}
            </a>
          </div>
        </div>

        <DesignTestimonial
          items={items}
          verticalLabel={t.carouselLabel}
          compactMobile
          className="mt-10 lg:mt-12"
        />
      </div>
    </section>
  );
}
