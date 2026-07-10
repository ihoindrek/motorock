import Link from "next/link";
import { HomeBlogPostsView } from "@/components/blog/home-blog-posts-view";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { getBlogPostsPage } from "@/lib/blog/posts";

const HOME_BLOG_POST_COUNT = 3;

type LatestBlogPostsSectionProps = {
  locale: Locale;
};

export async function LatestBlogPostsSection({ locale }: LatestBlogPostsSectionProps) {
  const dict = getDictionary(locale);
  const { posts } = await getBlogPostsPage({
    first: HOME_BLOG_POST_COUNT,
    locale,
  });

  if (posts.length === 0) {
    return null;
  }

  const blogHref = localizedHref(locale, "/blog");

  return (
    <section
      aria-labelledby="home-latest-blog"
      className="relative overflow-hidden border-t border-ink/8 bg-paper py-12 text-ink lg:py-14"
    >
      <div className="site-container relative z-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">{dict.blog.latestPostsEyebrow}</p>
            <h2 id="home-latest-blog" className="heading-block mt-2 text-ink">
              {dict.blog.latestPostsTitle}
            </h2>
          </div>
          <Link
            href={blogHref}
            prefetch
            scroll
            className="inline-flex items-center self-start rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper sm:self-auto"
          >
            {dict.blog.viewAllPosts}
          </Link>
        </header>

        <HomeBlogPostsView posts={posts} locale={locale} copy={dict.blog} />
      </div>
    </section>
  );
}
