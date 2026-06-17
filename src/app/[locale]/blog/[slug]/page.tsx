import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getBlogPostBySlug,
  getBlogPostSlugs,
  getRelatedBlogPosts,
} from "@/lib/blog/posts";

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const [enSlugs, etSlugs] = await Promise.all([
    getBlogPostSlugs("en"),
    getBlogPostSlugs("et"),
  ]);
  return [
    ...enSlugs.map((slug) => ({ locale: "en", slug })),
    ...etSlugs.map((slug) => ({ locale: "et", slug })),
  ];
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const dict = await getDictionary(locale);
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    return { title: dict.blog.articleNotFound };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.image ? [{ url: post.image }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const dict = await getDictionary(locale);
  const post = await getBlogPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(slug, locale);

  return (
    <BlogPostView
      post={post}
      relatedPosts={relatedPosts}
      locale={locale}
      copy={dict.blog}
    />
  );
}
