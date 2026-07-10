import { LegalDocumentView } from "@/components/legal/legal-document-view";
import {
  cookiePolicyScopeText,
  cookiePolicyUpdatedLabel,
} from "@/data/cookie-policy-content";
import { getCookieSections } from "@/data/legal-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type CookiesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CookiesPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Cookie Policy" };
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.legal.cookiesTitle,
    description: dict.legal.cookiesDescription,
    pathname: "/cookies",
  });
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <LegalDocumentView
      eyebrow={dict.legal.eyebrow}
      title={dict.legal.cookiesTitle}
      description={cookiePolicyScopeText(localeParam)}
      updated={cookiePolicyUpdatedLabel(localeParam)}
      sections={getCookieSections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactUsLabel={dict.common.contactUs}
      contactHref={localizedHref(localeParam, "/contact")}
      emailPrompt={dict.legal.emailPrompt}
    />
  );
}
