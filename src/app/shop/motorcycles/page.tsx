import { MotorcyclesCatalogView } from "@/components/shop/motorcycles-catalog-view";
import { getMotorcycleCatalog } from "@/lib/graphql/products";

export const metadata = {
  title: "Motorcycles",
  description: "Premium motorcycles from Brixton, Mutt, Motron and Malaguti.",
};

export const revalidate = 300;

export default async function MotorcyclesPage() {
  const motorcycles = await getMotorcycleCatalog();

  return <MotorcyclesCatalogView products={motorcycles} />;
}
