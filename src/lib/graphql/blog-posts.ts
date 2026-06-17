import { blogPosts as fallbackBlogPosts } from "@/data/blog-posts";
import type { Locale } from "@/i18n/config";
import { graphqlRequest } from "@/lib/graphql/client";
import { BLOG_POST_BY_SLUG, BLOG_POSTS_LIST } from "@/lib/graphql/blog-queries";
import {
  mapGraphqlToBlogPost,
  mapGraphqlToBlogPostCard,
} from "@/lib/graphql/map-graphql-post";
import type {
  BlogPostBySlugResponse,
  BlogPostsListResponse,
  BlogPostsPageInfo,
  GraphQLBlogPostCard,
} from "@/lib/graphql/types-blog";
import type { BlogPost } from "@/types/blog-post";

export type BlogPostsPage = {
  posts: BlogPost[];
  pageInfo: BlogPostsPageInfo;
};

export type { BlogPostsPageInfo };

const BLOG_LIST_SIZE = 50;
export const BLOG_INITIAL_PAGE_SIZE = 7;
export const BLOG_LOAD_MORE_SIZE = 6;

function isGraphqlPostCard(
  node: GraphQLBlogPostCard | null,
): node is GraphQLBlogPostCard {
  return Boolean(node?.slug && node?.title);
}

function sortPosts(posts: readonly BlogPost[]) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function getFallbackPosts(): readonly BlogPost[] {
  return sortPosts(fallbackBlogPosts);
}

function getFallbackPage(
  first: number,
  after: string | null,
  _locale: Locale,
): BlogPostsPage {
  const all = getFallbackPosts();
  const offset = after ? Number.parseInt(after, 10) : 0;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  const posts = all.slice(safeOffset, safeOffset + first);
  const nextOffset = safeOffset + posts.length;

  return {
    posts,
    pageInfo: {
      hasNextPage: nextOffset < all.length,
      endCursor: nextOffset < all.length ? String(nextOffset) : null,
    },
  };
}

export async function fetchBlogPostsPage({
  first,
  after = null,
  locale = "en",
}: {
  first: number;
  after?: string | null;
  locale?: Locale;
}): Promise<BlogPostsPage> {
  try {
    const data = await graphqlRequest<
      BlogPostsListResponse,
      { first: number; after: string | null; language: Locale }
    >(BLOG_POSTS_LIST, {
      first,
      after,
      language: locale,
    });

    const posts = data.contentNodes.nodes
      .filter(isGraphqlPostCard)
      .map(mapGraphqlToBlogPostCard);

    if (posts.length === 0 && !after) {
      return getFallbackPage(first, null, locale);
    }

    return {
      posts: sortPosts(posts),
      pageInfo: {
        hasNextPage: data.contentNodes.pageInfo.hasNextPage,
        endCursor: data.contentNodes.pageInfo.endCursor,
      },
    };
  } catch {
    return getFallbackPage(first, after, locale);
  }
}

export async function fetchAllBlogPosts(locale: Locale = "en"): Promise<readonly BlogPost[]> {
  try {
    const data = await graphqlRequest<BlogPostsListResponse>(BLOG_POSTS_LIST, {
      first: BLOG_LIST_SIZE,
      after: null,
      language: locale,
    });

    const posts = data.contentNodes.nodes
      .filter(isGraphqlPostCard)
      .map(mapGraphqlToBlogPostCard);

    if (posts.length === 0) {
      return getFallbackPosts();
    }

    return sortPosts(posts);
  } catch {
    return getFallbackPosts();
  }
}

export async function fetchBlogPostBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<BlogPost | undefined> {
  try {
    const data = await graphqlRequest<BlogPostBySlugResponse, { slug: string }>(
      BLOG_POST_BY_SLUG,
      { slug },
    );

    if (!data.post?.slug) {
      return getFallbackPosts().find((post) => post.slug === slug);
    }

    return mapGraphqlToBlogPost(data.post);
  } catch {
    return getFallbackPosts().find((post) => post.slug === slug);
  }
}

export async function fetchBlogPostSlugs(locale: Locale = "en"): Promise<string[]> {
  const posts = await fetchAllBlogPosts(locale);
  return posts.map((post) => post.slug);
}
