import { notFound } from "next/navigation";
import { MotorcyclesCatalogView } from "@/components/shop/motorcycles-catalog-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getMotorcycleCatalog } from "@/lib/graphql/products";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type MotorcyclesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MotorcyclesPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.pages.motorcyclesTitle,
    description: dict.pages.motorcyclesDescription,
    pathname: "/shop/motorcycles",
  });
}

// The ?brand= preselection is resolved client-side inside
// MotorcyclesCatalogView; reading searchParams here would force dynamic
// rendering and disable ISR.
export default async function MotorcyclesPage({ params }: MotorcyclesPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const motorcycles = await getMotorcycleCatalog(localeParam);

  return <MotorcyclesCatalogView products={motorcycles} />;
}
