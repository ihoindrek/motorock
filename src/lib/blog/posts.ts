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
import type { BlogPost } from "@/types/blog-post";

export {
  BLOG_INITIAL_PAGE_SIZE,
  BLOG_LOAD_MORE_SIZE,
  type BlogPostsPage,
  type BlogPostsPageInfo,
};

export async function getBlogPostsPage(
  options: Parameters<typeof fetchBlogPostsPage>[0],
) {
  return fetchBlogPostsPage(options);
}

export async function getAllBlogPosts(): Promise<readonly BlogPost[]> {
  return fetchAllBlogPosts();
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  return fetchBlogPostBySlug(slug);
}

export async function getBlogPostSlugs(): Promise<string[]> {
  return fetchBlogPostSlugs();
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
  limit = 3,
): Promise<readonly BlogPost[]> {
  const posts = await getAllBlogPosts();
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

export function formatBlogDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
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
