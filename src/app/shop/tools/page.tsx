import type { Metadata } from "next";
import { CategoryView } from "@/components/shop/category-view";
import { getToolsCatalog } from "@/lib/graphql/products";
import { toolsCatalogRoute } from "@/lib/shop/category";

export const revalidate = 300;

export const metadata: Metadata = {
  title: toolsCatalogRoute.title,
  description: toolsCatalogRoute.description,
};

export default async function ToolsPage() {
  const products = await getToolsCatalog();

  return (
    <CategoryView
      key="tools"
      route={toolsCatalogRoute}
      products={products}
    />
  );
}
