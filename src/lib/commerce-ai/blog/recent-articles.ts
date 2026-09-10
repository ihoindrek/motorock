import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { fetchBlogPostsPage } from "@/lib/graphql/blog-posts";

export type RecentArticleLink = {
  title: string;
  url: string;
};

/** Recent journal posts the AI can cross-link to (internal linking / SEO). */
export async function fetchRecentArticleLinks(
  locale: Locale,
  limit = 8,
): Promise<RecentArticleLink[]> {
  try {
    const page = await fetchBlogPostsPage({ first: limit, locale });

    return page.posts.map((post) => ({
      title: post.title,
      url: localizedHref(locale, `/blog/${post.slug}`),
    }));
  } catch {
    return [];
  }
}

export function formatRecentArticlesForPrompt(articles: RecentArticleLink[]) {
  if (articles.length === 0) {
    return "None";
  }

  return articles
    .map((article) => `- ${article.title} | ${article.url}`)
    .join("\n");
}
