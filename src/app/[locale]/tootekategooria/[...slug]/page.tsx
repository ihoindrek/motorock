import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  generateEquipmentCategoryMetadata,
  renderEquipmentCategoryPage,
} from "@/lib/shop/equipment-category-page";

export const revalidate = 300;

type TootekategooriaPageProps = {
  params: Promise<{ locale: string; slug: string[] }>;
};

export async function generateMetadata({
  params,
}: TootekategooriaPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return { title: "Category not found" };
  }

  return generateEquipmentCategoryMetadata({
    locale: localeParam,
    slug,
    routeTree: "et",
  });
}

export default async function TootekategooriaCategoryPage({
  params,
}: TootekategooriaPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return renderEquipmentCategoryPage({
    locale: localeParam,
    slug,
    routeTree: "et",
  });
}
