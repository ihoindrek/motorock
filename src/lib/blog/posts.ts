import {
  fetchAllBlogPosts,
  fetchBlogPostBySlug,
  fetchBlogPostSlugs,
  fetchBlogPostsPage,
  BLOG_INITIAL_PAGE_SIZE,
  BLOG_LOAD_MORE_SIZE,
  type BlogPostsPage,
  type BlogPostsPageInfo,
} from "@/lib/graphql/blog-posts";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/types/blog-post";

export {
  BLOG_INITIAL_PAGE_SIZE,
  BLOG_LOAD_MORE_SIZE,
  type BlogPostsPage,
  type BlogPostsPageInfo,
};

export async function getBlogPostsPage(
  options: Parameters<typeof fetchBlogPostsPage>[0] & { locale?: Locale },
) {
  return fetchBlogPostsPage(options);
}

export async function getAllBlogPosts(locale: Locale = "en"): Promise<readonly BlogPost[]> {
  return fetchAllBlogPosts(locale);
}

export async function getBlogPostBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<BlogPost | undefined> {
  return fetchBlogPostBySlug(slug, locale);
}

export async function getBlogPostSlugs(locale: Locale = "en"): Promise<string[]> {
  return fetchBlogPostSlugs(locale);
}

export function getBlogCategories(
  posts: readonly BlogPost[],
): readonly string[] {
  const categories = new Set<string>();

  for (const post of posts) {
    for (const category of post.categories) {
      categories.add(category);
    }
  }

  return [...categories].sort((a, b) => a.localeCompare(b));
}

export async function getRelatedBlogPosts(
  slug: string,
  locale: Locale = "en",
  limit = 3,
): Promise<readonly BlogPost[]> {
  const posts = await getAllBlogPosts(locale);
  const current = posts.find((post) => post.slug === slug);

  if (!current) {
    return [];
  }

  return posts
    .filter((post) => post.slug !== slug)
    .sort((a, b) => {
      const aShared = a.categories.some((category) =>
        current.categories.includes(category),
      );
      const bShared = b.categories.some((category) =>
        current.categories.includes(category),
      );

      if (aShared !== bShared) {
        return Number(bShared) - Number(aShared);
      }

      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    })
    .slice(0, limit);
}

export function formatBlogDate(isoDate: string, locale: "en" | "et" = "en") {
  const dateLocale = locale === "et" ? "et-EE" : "en-GB";

  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function postMatchesCategory(
  post: BlogPost,
  category: string,
): boolean {
  return post.categories.includes(category);
}
