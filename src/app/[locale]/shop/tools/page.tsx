import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { fetchProductCategoryBySlug } from "@/lib/graphql/categories";
import { buildShopCategoryHref } from "@/lib/shop/shop-category-route";
import { TOOLS_WC_SLUG } from "@/lib/shop/wc-categories";

type ToolsLegacyPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ToolsLegacyRedirect({
  params,
}: ToolsLegacyPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const node = await fetchProductCategoryBySlug(TOOLS_WC_SLUG);
  const target = node
    ? buildShopCategoryHref(node, localeParam)
    : `/shop/${TOOLS_WC_SLUG}`;

  redirect(localizedHref(localeParam, target));
}
