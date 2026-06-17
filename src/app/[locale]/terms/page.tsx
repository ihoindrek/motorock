import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { getTermsSections } from "@/data/legal-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { notFound } from "next/navigation";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TermsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Terms & Conditions" };
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.legal.termsTitle,
    description: dict.legal.termsDescription,
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <LegalDocumentView
      eyebrow={dict.legal.eyebrow}
      title={dict.legal.termsTitle}
      description={dict.legal.termsDescription}
      updated="17 June 2026"
      sections={getTermsSections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactUsLabel={dict.common.contactUs}
      contactHref={localizedHref(localeParam, "/contact")}
    />
  );
}
