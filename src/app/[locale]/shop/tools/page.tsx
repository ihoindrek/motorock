import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import { isLocale } from "@/i18n/config";
import { getToolsCatalog } from "@/lib/graphql/products";
import { toolsCatalogRoute } from "@/lib/shop/category";

export const revalidate = 300;

export const metadata: Metadata = {
  title: toolsCatalogRoute.title,
  description: toolsCatalogRoute.description,
};

type ToolsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  if (localeParam !== "et") {
    notFound();
  }

  const products = await getToolsCatalog(localeParam);

  return (
    <CategoryView
      key="tools"
      route={toolsCatalogRoute}
      products={products}
    />
  );
}
