import Image from "next/image";
import Link from "next/link";
import { BlogBadge } from "@/components/blog/blog-badge";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { HomeBlogPostsView } from "@/components/blog/home-blog-posts-view";
import { GiveawayCountdown } from "@/components/giveaway/giveaway-countdown";
import { getCampaignForBlogPost } from "@/lib/campaigns/blog";
import { formatBlogDate } from "@/lib/blog/posts";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import type { BlogPost } from "@/types/blog-post";

type BlogPostViewProps = {
  post: BlogPost;
  relatedPosts?: readonly BlogPost[];
  locale: "en" | "et";
  copy: Dictionary["blog"];
};

export function BlogPostView({
  post,
  relatedPosts = [],
  locale,
  copy,
}: BlogPostViewProps) {
  const campaign = getCampaignForBlogPost(post);
  const blogHref = localizedHref(locale, "/blog");
  const shopHref = localizedHref(
    locale,
    campaign ? buildEquipmentHubHref(locale) : "/shop/motorcycles",
  );

  return (
    <article>
      <header className="relative min-h-[72vh] overflow-hidden bg-ink text-paper">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25"
          aria-hidden="true"
        />
        <div className="site-container relative z-10 flex min-h-[72vh] flex-col justify-end pb-10 pt-28 sm:pb-14 lg:pb-16">
          <Link href={blogHref} className="mb-8 inline-flex w-fit">
            <BlogBadge variant="on-dark">{copy.backToArticles}</BlogBadge>
          </Link>
          <div className="max-w-4xl">
            <BlogBadge variant="accent">{post.category}</BlogBadge>
            <h1 className="mt-4 font-display text-[clamp(1.65rem,5.5vw,4.4rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-paper sm:text-[clamp(2rem,6vw,4.4rem)]">
              {post.title}
            </h1>
            {campaign ? (
              <GiveawayCountdown
                targetDate={campaign.activeUntil}
                className="mt-6"
              />
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <BlogBadge variant="on-dark">
                <time dateTime={post.publishedAt}>
                  {formatBlogDate(post.publishedAt, locale)}
                </time>
              </BlogBadge>
              <BlogBadge variant="on-dark">{post.author}</BlogBadge>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-paper py-14 lg:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-2xl">
            {post.excerpt ? (
              <p className="border-l-2 border-accent pl-5 text-xl font-medium leading-relaxed text-ink sm:pl-6 sm:text-2xl sm:leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}

            {post.contentHtml ? (
              <div className={post.excerpt ? "mt-12 sm:mt-14" : undefined}>
                <BlogPostContent html={post.contentHtml} />
              </div>
            ) : null}

            <footer className="mt-14 flex flex-col gap-6 border-t border-ink/10 pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={blogHref}
                className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
              >
                {copy.allArticles}
              </Link>
              <Link href={shopHref} className="btn-accent">
                {campaign ? copy.shopNow : copy.shopMotorcycles}
              </Link>
            </footer>
          </div>
        </div>
      </div>

      {relatedPosts.length > 0 ? (
        <section
          aria-labelledby="related-articles-heading"
          className="relative overflow-hidden border-t border-ink/8 bg-paper py-12 text-ink lg:py-14"
        >
          <div className="site-container relative z-10">
            <header className="mb-6 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow">{copy.keepReading}</p>
                <h2
                  id="related-articles-heading"
                  className="mt-1.5 font-body text-2xl font-bold leading-snug tracking-tight text-ink sm:text-[1.65rem]"
                >
                  {copy.relatedStories}
                </h2>
              </div>
              <Link
                href={blogHref}
                className="inline-flex items-center self-start rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper sm:self-auto"
              >
                {copy.viewAllPosts}
              </Link>
            </header>

            <HomeBlogPostsView
              posts={relatedPosts}
              locale={locale}
              copy={copy}
            />
          </div>
        </section>
      ) : null}
    </article>
  );
}
