import { ReturnsWithFormView } from "@/components/returns/returns-with-form-view";
import { getReturnsSections } from "@/data/legal-content";
import { POLICY_LAST_UPDATED } from "@/data/storefront-policies";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type ReturnsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ReturnsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Returns & Exchanges" };
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.legal.returnsTitle,
    description: dict.legal.returnsDescription,
    pathname: "/returns",
  });
}

export default async function ReturnsPage({ params }: ReturnsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <ReturnsWithFormView
      locale={localeParam}
      title={dict.legal.returnsTitle}
      description={dict.legal.returnsDescription}
      updated={POLICY_LAST_UPDATED[localeParam]}
      sections={getReturnsSections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactUsLabel={dict.common.contactUs}
      contactHref={localizedHref(localeParam, "/contact")}
      emailPrompt={dict.legal.emailPrompt}
    />
  );
}
