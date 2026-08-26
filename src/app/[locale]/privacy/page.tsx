import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { getPrivacySections } from "@/data/legal-content";
import { POLICY_LAST_UPDATED } from "@/data/storefront-policies";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { notFound } from "next/navigation";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Privacy Policy" };
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.legal.privacyTitle,
    description: dict.legal.privacyDescription,
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <LegalDocumentView
      locale={localeParam}
      currentId="privacy"
      title={dict.legal.privacyTitle}
      description={dict.legal.privacyDescription}
      updated={POLICY_LAST_UPDATED[localeParam]}
      sections={getPrivacySections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactUsLabel={dict.common.contactUs}
      contactHref={localizedHref(localeParam, "/contact")}
      emailPrompt={dict.legal.emailPrompt}
    />
  );
}
