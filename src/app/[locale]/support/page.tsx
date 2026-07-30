import { CustomerSupportView } from "@/components/legal/customer-support-view";
import { getSupportSections } from "@/data/legal-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type SupportPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SupportPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Customer Support" };
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.legal.supportTitle,
    description: dict.legal.supportDescription,
    pathname: "/support",
  });
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dict = getDictionary(localeParam);

  return (
    <CustomerSupportView
      locale={localeParam}
      title={dict.legal.supportTitle}
      description={dict.legal.supportDescription}
      updated="6 July 2026"
      sections={getSupportSections(localeParam)}
      lastUpdatedLabel={dict.legal.lastUpdated}
      questionsLabel={dict.legal.questions}
      contactHref={localizedHref(localeParam, "/contact")}
      emailPrompt={dict.legal.emailPrompt}
      contactStrip={dict.legal.supportContact}
    />
  );
}
