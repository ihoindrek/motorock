import {
  estimateReadTime,
  normalizeWordPressMediaUrl,
  pickFirstImageFromHtml,
  rewriteBlogContentLinks,
  stripHtml,
} from "@/lib/blog/html";
import { getLocalizedCategoryName } from "@/lib/graphql/categories";
import type { GraphQLBlogPost, GraphQLBlogPostCard } from "@/lib/graphql/types-blog";
import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/types/blog-post";

const FALLBACK_IMAGE = "/brixton-image.webp";

function getCategories(post: GraphQLBlogPostCard, locale: Locale): string[] {
  return (
    post.categories?.nodes
      ?.map((category) => getLocalizedCategoryName(category, locale).trim())
      .filter(Boolean) ?? []
  );
}

function getFeaturedImage(post: GraphQLBlogPostCard, content?: string | null) {
  const featured = post.featuredImage?.node;

  if (featured?.sourceUrl) {
    return {
      image: normalizeWordPressMediaUrl(featured.sourceUrl),
      imageAlt: featured.altText?.trim() || post.title,
    };
  }

  const inlineImage = pickFirstImageFromHtml(content ?? post.excerpt);
  if (inlineImage) {
    return {
      image: inlineImage,
      imageAlt: post.title,
    };
  }

  return {
    image: FALLBACK_IMAGE,
    imageAlt: post.title,
  };
}

export function mapGraphqlToBlogPostCard(
  post: GraphQLBlogPostCard,
  locale: Locale = "en",
): BlogPost {
  const categories = getCategories(post, locale);
  const excerpt = stripHtml(post.excerpt ?? "");
  const { image, imageAlt } = getFeaturedImage(post);

  return {
    slug: post.slug,
    title: stripHtml(post.title),
    excerpt,
    category: categories[0] ?? "Journal",
    categories,
    publishedAt: post.date,
    readTime: estimateReadTime(post.excerpt ?? post.title),
    image,
    imageAlt,
    author: post.author?.node?.name?.trim() || "Motorock editorial",
    contentHtml: "",
  };
}

export function mapGraphqlToBlogPost(
  post: GraphQLBlogPost,
  locale: Locale = "en",
): BlogPost {
  const contentHtml = rewriteBlogContentLinks(post.content ?? "", locale);
  const card = mapGraphqlToBlogPostCard(post, locale);
  const { image, imageAlt } = getFeaturedImage(post, contentHtml);

  return {
    ...card,
    readTime: estimateReadTime(contentHtml || post.excerpt || post.title),
    image,
    imageAlt,
    contentHtml,
  };
}
