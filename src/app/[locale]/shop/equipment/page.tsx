import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EquipmentHubView } from "@/components/shop/equipment-hub-view";
import { getEquipmentHubData } from "@/data/equipment-hub";
import { isLocale } from "@/i18n/config";

export const revalidate = 300;

type EquipmentHubPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: EquipmentHubPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const { copy } = getEquipmentHubData(locale);

  return {
    title: `${copy.title} ${copy.accent}`,
    description: copy.description,
  };
}

export default async function EquipmentHubPage({ params }: EquipmentHubPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <EquipmentHubView locale={localeParam} />;
}
