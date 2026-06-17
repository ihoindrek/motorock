import type { Metadata } from "next";
import { CategoryView } from "@/components/shop/category-view";
import { getEquipmentCatalogForRoute } from "@/lib/graphql/products";
import { parseEquipmentSlug } from "@/lib/shop/category";

export const revalidate = 300;

type EquipmentCategoryPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({
  params,
}: EquipmentCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseEquipmentSlug(slug);

  return {
    title: route.title,
    description: route.description,
  };
}

export default async function EquipmentCategoryPage({
  params,
}: EquipmentCategoryPageProps) {
  const { slug } = await params;
  const route = parseEquipmentSlug(slug);
  const products = await getEquipmentCatalogForRoute(route);

  return (
    <CategoryView
      key={slug.join("/")}
      route={route}
      products={products}
    />
  );
}
