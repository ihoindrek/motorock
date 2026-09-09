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
      className="home-section-padding relative overflow-hidden bg-white text-ink"
    >
      <div className="site-container relative z-10">
        <header className="home-section-header">
          <div>
            <p className="section-eyebrow">{dict.blog.latestPostsEyebrow}</p>
            <h2 id="home-latest-blog" className="heading-block mt-3 text-ink sm:mt-4">
              {dict.blog.latestPostsTitle}
            </h2>
          </div>
          <Link
            href={blogHref}
            prefetch
            scroll
            className="inline-flex shrink-0 items-center rounded-full border border-ink/15 bg-white px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper"
          >
            {dict.blog.viewAllPosts}
          </Link>
        </header>

        <HomeBlogPostsView posts={posts} locale={locale} copy={dict.blog} />
      </div>
    </section>
  );
}
