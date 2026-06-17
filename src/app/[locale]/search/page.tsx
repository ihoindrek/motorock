import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchResultsView } from "@/components/shop/search-results-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSearchCatalog } from "@/lib/graphql/search";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!isLocale(localeParam)) {
    return { title: "Search" };
  }

  const dict = getDictionary(localeParam);

  if (query.length >= 2) {
    return {
      title: `${dict.search.resultsTitle}: ${query}`,
      description: dict.search.resultsDescription.replace("your query", query),
    };
  }

  return {
    title: dict.search.pageTitle,
    description: dict.search.pageDescription,
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale: localeParam } = await params;
  const { q } = await searchParams;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const query = q?.trim() ?? "";
  const dictionary = getDictionary(localeParam);
  const products =
    query.length >= 2 ? await getSearchCatalog(query, localeParam) : [];

  return (
    <SearchResultsView
      query={query}
      products={products}
      dictionary={dictionary}
      locale={localeParam}
    />
  );
}
