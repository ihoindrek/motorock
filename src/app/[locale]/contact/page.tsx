import { notFound } from "next/navigation";
import { ContactView } from "@/components/contact/contact-view";
import { ShowroomGoogleReviewsSection } from "@/components/contact/showroom-google-reviews-section";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getShowroomGoogleReviews } from "@/lib/google/fetch-showroom-reviews";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildLocalBusinessJsonLd } from "@/lib/seo/site-schema";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {
      title: "Contact",
      description:
        "Contact Motorock.eu — showroom, test rides, orders, and riding gear advice.",
    };
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.nav.contact,
    description:
      localeParam === "et"
        ? "Võta Motorock.eu-ga ühendust — salong, proovisõidud, tellimused ja varustuse nõuanded."
        : "Contact Motorock.eu — showroom, test rides, orders, and riding gear advice.",
    pathname: "/contact",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const googleReviews = await getShowroomGoogleReviews();

  return (
    <>
      {googleReviews ? (
        <JsonLd
          schema={buildLocalBusinessJsonLd({
            rating: googleReviews.rating,
            reviewCount: googleReviews.reviewCount,
          })}
        />
      ) : null}
      <ContactView locale={localeParam} />
      <ShowroomGoogleReviewsSection locale={localeParam} />
    </>
  );
}
