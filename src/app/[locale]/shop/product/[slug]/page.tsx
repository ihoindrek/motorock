import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { redirectLegacyProductPath } from "@/lib/shop/product-page";

type LegacyProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  redirectLegacyProductPath(localeParam, slug);
}
