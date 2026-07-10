import type { Metadata } from "next";
import { BlogListView } from "@/components/blog/blog-list-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getAllBlogPosts,
  getBlogCategories,
  getBlogPostsPage,
  BLOG_INITIAL_PAGE_SIZE,
} from "@/lib/blog/posts";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type BlogPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.blog.pageTitle,
    description: dict.blog.pageDescription,
    pathname: "/blog",
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const dict = await getDictionary(locale);

  const [initialPage, allPosts] = await Promise.all([
    getBlogPostsPage({ first: BLOG_INITIAL_PAGE_SIZE, locale }),
    getAllBlogPosts(locale),
  ]);

  return (
    <BlogListView
      initialPosts={initialPage.posts}
      initialPageInfo={initialPage.pageInfo}
      categories={getBlogCategories(allPosts)}
      locale={locale}
      copy={dict.blog}
    />
  );
}
