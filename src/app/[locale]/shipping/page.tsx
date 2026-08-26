import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { getShippingSections } from "@/data/legal-content";
import { POLICY_LAST_UPDATED } from "@/data/storefront-policies";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { notFound } from "next/navigation";

type ShippingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ShippingPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Shipping & Delivery" };
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.legal.shippingTitle,
    description: dict.legal.shippingDescription,
  };
}

export default async function ShippingPage({ params }: ShippingPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <LegalDocumentView
      locale={localeParam}
      currentId="shipping"
      title={dict.legal.shippingTitle}
      description={dict.legal.shippingDescription}
      updated={POLICY_LAST_UPDATED[localeParam]}
      sections={getShippingSections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactUsLabel={dict.common.contactUs}
      contactHref={localizedHref(localeParam, "/contact")}
      emailPrompt={dict.legal.emailPrompt}
    />
  );
}
