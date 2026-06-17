import { MotorcyclesCatalogView } from "@/components/shop/motorcycles-catalog-view";
import { getMotorcycleCatalog } from "@/lib/graphql/products";
import { resolveMotorcycleBrandFromSlug } from "@/lib/shop/brand-catalog-url";

export const metadata = {
  title: "Motorcycles",
  description: "Premium motorcycles from Brixton, Mutt, Motron and Malaguti.",
};

export const revalidate = 300;

type MotorcyclesPageProps = {
  searchParams: Promise<{ brand?: string }>;
};

export default async function MotorcyclesPage({
  searchParams,
}: MotorcyclesPageProps) {
  const { brand: brandSlug } = await searchParams;
  const motorcycles = await getMotorcycleCatalog();
  const brandNames = [...new Set(motorcycles.map((product) => product.brand))];
  const initialBrand = resolveMotorcycleBrandFromSlug(brandSlug, brandNames);

  return (
    <MotorcyclesCatalogView
      products={motorcycles}
      initialBrand={initialBrand}
    />
  );
}
