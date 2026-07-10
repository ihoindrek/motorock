import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateEquipmentHubMetadata,
  renderEquipmentHubPage,
} from "@/lib/shop/equipment-hub-page";

export const revalidate = 300;

type TootekategooriaHubPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TootekategooriaHubPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Tootekategooria" };
  }

  return generateEquipmentHubMetadata({ locale: localeParam });
}

export default async function TootekategooriaHubPage({
  params,
}: TootekategooriaHubPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return renderEquipmentHubPage({ locale: localeParam, routeTree: "et" });
}
