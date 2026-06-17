import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import { getEquipmentCatalog } from "@/lib/graphql/products";

export const revalidate = 300;

const brandMap: Record<string, string> = {
  "pando-moto": "Pando Moto",
  holyfreedom: "Holyfreedom",
  "johnny-reb": "Johnny Reb",
  bobhead: "Bobhead",
  motogirl: "Motogirl",
};

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandName = brandMap[brand];

  if (!brandName) {
    return { title: "Brand not found" };
  }

  return {
    title: brandName,
    description: `Shop ${brandName} riding gear at Motorock.eu`,
  };
}

export default async function BrandCategoryPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const brandName = brandMap[brand];

  if (!brandName) {
    notFound();
  }

  const products = await getEquipmentCatalog();

  const route = {
    title: brandName,
    description: `Explore ${brandName} — premium riding gear and rebel essentials.`,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Driving Equipment", href: "/shop/equipment" },
      { label: brandName, href: `/shop/brands/${brand}` },
    ],
    brand: brandName,
  };

  return <CategoryView route={route} products={products} />;
}
