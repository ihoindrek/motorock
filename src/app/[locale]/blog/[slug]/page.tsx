import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getBlogPostBySlug,
  getBlogPostSlugAlternates,
  getBlogPostSlugs,
  getRelatedBlogPosts,
} from "@/lib/blog/posts";
import { normalizeBlogSlug } from "@/lib/blog/slug";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
  const { locale: localeParam, slug: rawSlug } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const slug = normalizeBlogSlug(rawSlug);
  const dict = await getDictionary(locale);
  const [post, slugAlternates] = await Promise.all([
    getBlogPostBySlug(slug, locale),
    getBlogPostSlugAlternates(slug),
  ]);

  if (!post) {
    return { title: dict.blog.articleNotFound };
  }

  const base = buildPageMetadata({
    locale,
    title: post.title,
    description: post.excerpt,
    pathname: "/blog/post",
    slugAlternates,
    slugPathTemplate: "/blog/{slug}",
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.image ? [{ url: post.image }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale: localeParam, slug: rawSlug } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const slug = normalizeBlogSlug(rawSlug);
  const dict = await getDictionary(locale);
  const [post, slugAlternates] = await Promise.all([
    getBlogPostBySlug(slug, locale),
    getBlogPostSlugAlternates(slug),
  ]);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(slug, locale);

  return (
    <>
      <ProductLocaleAlternates alternates={slugAlternates} />
      <BlogPostView
        post={post}
        relatedPosts={relatedPosts}
        locale={locale}
        copy={dict.blog}
      />
    </>
  );
}
