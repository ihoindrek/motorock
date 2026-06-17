import { searchProductsWithMeta } from "@/lib/graphql/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") ?? "5", 10) || 5, 1),
    20,
  );

  if (query.length < 2) {
    return Response.json({ results: [], query, hasMore: false });
  }

  try {
    const { results, hasMore } = await searchProductsWithMeta(query, limit);
    return Response.json({ results, query, hasMore });
  } catch (error) {
    console.error("[search] GraphQL search failed:", error);
    return Response.json(
      { results: [], query, hasMore: false, error: "Search unavailable" },
      { status: 503 },
    );
  }
}
