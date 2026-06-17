import { notFound } from "next/navigation";
import { MotorcyclesCatalogView } from "@/components/shop/motorcycles-catalog-view";
import { isLocale } from "@/i18n/config";
import { getMotorcycleCatalog } from "@/lib/graphql/products";
import { resolveMotorcycleBrandFromSlug } from "@/lib/shop/brand-catalog-url";

export const metadata = {
  title: "Motorcycles",
  description: "Premium motorcycles from Brixton, Mutt, Motron and Malaguti.",
};

export const revalidate = 300;

type MotorcyclesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ brand?: string }>;
};

export default async function MotorcyclesPage({
  params,
  searchParams,
}: MotorcyclesPageProps) {
  const { locale: localeParam } = await params;
  const { brand: brandSlug } = await searchParams;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const motorcycles = await getMotorcycleCatalog(localeParam);
  const brandNames = [...new Set(motorcycles.map((product) => product.brand))];
  const initialBrand = resolveMotorcycleBrandFromSlug(brandSlug, brandNames);

  return (
    <MotorcyclesCatalogView
      products={motorcycles}
      initialBrand={initialBrand}
    />
  );
}
