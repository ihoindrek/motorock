import { blogPosts as fallbackBlogPosts } from "@/data/blog-posts";
import { normalizeBlogSlug, blogSlugsMatch } from "@/lib/blog/slug";
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
  GraphQLBlogPost,
  GraphQLBlogPostCard,
} from "@/lib/graphql/types-blog";
import {
  buildPostSlugAlternates,
  findTranslationSlug,
  getGraphqlLanguageCode,
  resolveLocalizedPostFields,
} from "@/lib/graphql/wpml";
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

async function fetchRawPostBySlug(slug: string): Promise<GraphQLBlogPost | null> {
  const normalizedSlug = normalizeBlogSlug(slug);
  const data = await graphqlRequest<BlogPostBySlugResponse, { slug: string }>(
    BLOG_POST_BY_SLUG,
    { slug: normalizedSlug },
  );

  return data.post?.slug ? data.post : null;
}

function findSourceNodeBySlug(
  nodes: readonly GraphQLBlogPostCard[],
  slug: string,
): GraphQLBlogPostCard | undefined {
  return nodes.find((node) => {
    if (blogSlugsMatch(slug, node.slug)) {
      return true;
    }

    return node.translations?.some((translation) =>
      blogSlugsMatch(slug, translation.slug),
    );
  });
}

async function resolveLocalizedPostCard(
  node: GraphQLBlogPostCard,
  locale: Locale,
): Promise<BlogPost> {
  const language = getGraphqlLanguageCode(node);

  if (language === locale) {
    return mapGraphqlToBlogPostCard(node, locale);
  }

  const translatedSlug = findTranslationSlug(node, locale);
  if (translatedSlug) {
    const translated = await fetchRawPostBySlug(translatedSlug);
    if (translated) {
      return mapGraphqlToBlogPostCard(translated, locale);
    }
  }

  const localized = resolveLocalizedPostFields(node, locale);
  const card = mapGraphqlToBlogPostCard(node, locale);

  return {
    ...card,
    slug: localized.slug,
    title: localized.title,
  };
}

async function mapLocalizedPostCards(
  nodes: readonly GraphQLBlogPostCard[],
  locale: Locale,
): Promise<BlogPost[]> {
  return Promise.all(nodes.map((node) => resolveLocalizedPostCard(node, locale)));
}

async function fetchLocalizedPostBySlug(
  slug: string,
  locale: Locale,
  sourceNodes?: readonly GraphQLBlogPostCard[],
): Promise<BlogPost | undefined> {
  const normalizedSlug = normalizeBlogSlug(slug);
  const post = await fetchRawPostBySlug(normalizedSlug);

  if (!post) {
    const nodes = sourceNodes ?? (await fetchBlogSourceNodes());
    const source = findSourceNodeBySlug(nodes, normalizedSlug);
    if (source) {
      return resolveLocalizedPostCard(source, locale);
    }

    return undefined;
  }

  const language = getGraphqlLanguageCode(post);

  if (language === locale) {
    return mapGraphqlToBlogPost(post, locale);
  }

  const translatedSlug = findTranslationSlug(post, locale);
  if (translatedSlug) {
    const translated = await fetchRawPostBySlug(translatedSlug);
    if (translated) {
      return mapGraphqlToBlogPost(translated, locale);
    }
  }

  return mapGraphqlToBlogPost(post, locale);
}

async function fetchBlogSourceNodes(): Promise<GraphQLBlogPostCard[]> {
  const data = await graphqlRequest<
    BlogPostsListResponse,
    { first: number; after: string | null }
  >(BLOG_POSTS_LIST, {
    first: BLOG_LIST_SIZE,
    after: null,
  });

  return data.contentNodes.nodes.filter(isGraphqlPostCard);
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
    const nodes = await fetchBlogSourceNodes();
    const posts = sortPosts(await mapLocalizedPostCards(nodes, locale));
    const offset = after ? Number.parseInt(after, 10) : 0;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    const pagePosts = posts.slice(safeOffset, safeOffset + first);
    const nextOffset = safeOffset + pagePosts.length;

    return {
      posts: pagePosts,
      pageInfo: {
        hasNextPage: nextOffset < posts.length,
        endCursor: nextOffset < posts.length ? String(nextOffset) : null,
      },
    };
  } catch (error) {
    console.error("[blog] GraphQL list failed, using fallback posts:", error);
    return getFallbackPage(first, after, locale);
  }
}

export async function fetchAllBlogPosts(
  locale: Locale = "en",
): Promise<readonly BlogPost[]> {
  try {
    const nodes = await fetchBlogSourceNodes();
    return sortPosts(await mapLocalizedPostCards(nodes, locale));
  } catch (error) {
    console.error("[blog] GraphQL list failed, using fallback posts:", error);
    return getFallbackPosts();
  }
}

export async function fetchBlogPostBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<BlogPost | undefined> {
  const normalizedSlug = normalizeBlogSlug(slug);

  try {
    return await fetchLocalizedPostBySlug(normalizedSlug, locale);
  } catch (error) {
    console.error("[blog] GraphQL post failed, trying fallback:", error);
    return getFallbackPosts().find((post) =>
      blogSlugsMatch(normalizedSlug, post.slug),
    );
  }
}

export async function fetchBlogPostSlugs(locale: Locale = "en"): Promise<string[]> {
  const posts = await fetchAllBlogPosts(locale);
  return posts.map((post) => post.slug);
}

export async function fetchBlogPostSlugAlternates(
  slug: string,
): Promise<Partial<Record<Locale, string>>> {
  const normalizedSlug = normalizeBlogSlug(slug);

  try {
    const post = await fetchRawPostBySlug(normalizedSlug);

    if (!post) {
      return { en: normalizedSlug, et: normalizedSlug };
    }

    return buildPostSlugAlternates(post);
  } catch {
    return { en: normalizedSlug, et: normalizedSlug };
  }
}

export async function fetchBlogSitemapEntries(): Promise<
  Array<Partial<Record<Locale, string>>>
> {
  const nodes = await fetchBlogSourceNodes();
  const seen = new Set<string>();

  return nodes
    .map((node) => buildPostSlugAlternates(node))
    .filter((alternates) => {
      const key = JSON.stringify(alternates);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return Boolean(alternates.en ?? alternates.et);
    });
}
