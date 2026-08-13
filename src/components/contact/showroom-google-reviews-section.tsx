import { GoogleReviewsPanel } from "@/components/contact/google-reviews-panel";
import type { Locale } from "@/i18n/config";
import { getShowroomGoogleReviews } from "@/lib/google/fetch-showroom-reviews";

type ShowroomGoogleReviewsSectionProps = {
  locale: Locale;
};

export async function ShowroomGoogleReviewsSection({
  locale,
}: ShowroomGoogleReviewsSectionProps) {
  const reviews = await getShowroomGoogleReviews();

  if (!reviews) {
    return null;
  }

  return <GoogleReviewsPanel locale={locale} reviews={reviews} />;
}
