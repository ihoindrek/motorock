import type { Metadata } from "next";
import { SearchResultsView } from "@/components/shop/search-results-view";
import { getSearchCatalog } from "@/lib/graphql/search";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (query.length >= 2) {
    return {
      title: `Search: ${query}`,
      description: `Shop products matching “${query}” at Motorock.eu.`,
    };
  }

  return {
    title: "Search",
    description: "Search motorcycles, riding equipment, and tools at Motorock.eu.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query.length >= 2 ? await getSearchCatalog(query) : [];

  return <SearchResultsView query={query} products={products} />;
}
