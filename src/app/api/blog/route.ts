import {
  BLOG_LOAD_MORE_SIZE,
  fetchBlogPostsPage,
} from "@/lib/graphql/blog-posts";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");
  const localeParam = searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : "en";
  const first = Math.min(
    Math.max(Number.parseInt(searchParams.get("first") ?? String(BLOG_LOAD_MORE_SIZE), 10) || BLOG_LOAD_MORE_SIZE, 1),
    20,
  );

  try {
    const page = await fetchBlogPostsPage({
      first,
      after,
      locale,
    });

    return Response.json(page);
  } catch (error) {
    console.error("[blog] load more failed:", error);
    return Response.json(
      {
        posts: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        error: "Blog unavailable",
      },
      { status: 503 },
    );
  }
}
