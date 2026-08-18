import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { ProductLocaleAlternates } from "@/components/locale-alternates";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import {
  getBlogPostBySlug,
  getBlogPostSlugAlternates,
  getRelatedBlogPosts,
} from "@/lib/blog/posts";
import { blogSlugsMatch, normalizeBlogSlug } from "@/lib/blog/slug";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo/site-schema";
import { getStorefrontUrl } from "@/lib/storefront/url";

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

// No build-time prerender — blog posts fetch WordPress at runtime and ISR-cache.
export function generateStaticParams() {
  return [];
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
      ...(post.image ? { images: [{ url: post.image }] } : {}),
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

  const canonicalSlug = slugAlternates[locale] ?? post.slug;
  if (canonicalSlug && !blogSlugsMatch(canonicalSlug, slug)) {
    redirect(localizedHref(locale, `/blog/${canonicalSlug}`));
  }

  const relatedPosts = await getRelatedBlogPosts(slug, locale);

  const base = getStorefrontUrl();
  const canonicalUrl = `${base}${localizedHref(locale, `/blog/${post.slug}`)}`;

  return (
    <>
      <JsonLd schema={buildBlogPostingJsonLd(post, canonicalUrl)} />
      <JsonLd
        schema={buildBreadcrumbJsonLd([
          {
            name: dict.pdp.breadcrumbHome,
            url: `${base}${localizedHref(locale, "/")}`,
          },
          {
            name: dict.blog.pageTitle,
            url: `${base}${localizedHref(locale, "/blog")}`,
          },
          { name: post.title },
        ])}
      />
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
