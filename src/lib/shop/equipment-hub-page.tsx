import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EquipmentHubView } from "@/components/shop/equipment-hub-view";
import { getEquipmentHubData } from "@/data/equipment-hub";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { fetchEquipmentCategoryIndex, navTreeFromIndex } from "@/lib/graphql/categories";
import {
  buildEquipmentHubHref,
  equipmentRouteTreeForLocale,
  type EquipmentRouteTree,
} from "@/lib/shop/category-url";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { TOOLS_WC_SLUG } from "@/lib/shop/wc-categories";

type EquipmentHubPageArgs = {
  locale: Locale;
  routeTree: EquipmentRouteTree;
};

export async function generateEquipmentHubMetadata({
  locale,
}: Pick<EquipmentHubPageArgs, "locale">): Promise<Metadata> {
  const { copy } = getEquipmentHubData(locale);

  return buildPageMetadata({
    locale,
    title: `${copy.title} ${copy.accent}`,
    description: copy.description,
    pathname: buildEquipmentHubHref(locale),
  });
}

export async function renderEquipmentHubPage({ locale, routeTree }: EquipmentHubPageArgs) {
  if (equipmentRouteTreeForLocale(locale) !== routeTree) {
    redirect(localizedHref(locale, buildEquipmentHubHref(locale)));
  }

  const categoryIndex = await fetchEquipmentCategoryIndex(locale);
  const categoryTree = categoryIndex ? navTreeFromIndex(categoryIndex) : null;
  const toolsCategory = categoryIndex?.nodes.get(TOOLS_WC_SLUG) ?? null;
  const hubData = getEquipmentHubData(locale, categoryTree, toolsCategory);

  return <EquipmentHubView locale={locale} hubData={hubData} />;
}