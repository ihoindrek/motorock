"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlogPageHeader } from "@/components/blog/blog-page-header";
import { BlogCard, BlogCardGrid } from "@/components/blog/blog-card";
import { BlogBadge, blogFilterBadgeClassName } from "@/components/blog/blog-badge";
import {
  BLOG_LOAD_MORE_SIZE,
  postMatchesCategory,
  type BlogPostsPageInfo,
} from "@/lib/blog/posts";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { BlogPost } from "@/types/blog-post";

type BlogListContentProps = {
  initialPosts: readonly BlogPost[];
  initialPageInfo: BlogPostsPageInfo;
  categories: readonly string[];
  locale: "en" | "et";
  copy: Dictionary["blog"];
};

function mergePosts(
  current: readonly BlogPost[],
  incoming: readonly BlogPost[],
) {
  const seen = new Set(current.map((post) => post.slug));
  const next = incoming.filter((post) => !seen.has(post.slug));
  return next.length > 0 ? [...current, ...next] : current;
}

export function BlogListContent({
  initialPosts,
  initialPageInfo,
  categories,
  locale,
  copy,
}: BlogListContentProps) {
  const [activeCategory, setActiveCategory] = useState<string | "All">("All");
  const [posts, setPosts] = useState<readonly BlogPost[]>(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") {
      return posts;
    }

    return posts.filter((post) => postMatchesCategory(post, activeCategory));
  }, [activeCategory, posts]);

  const [featured, ...rest] = filteredPosts;

  const loadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || isLoading) {
      return;
    }

    setIsLoading(true);
    setLoadError(false);

    try {
      const params = new URLSearchParams({
        first: String(BLOG_LOAD_MORE_SIZE),
        locale,
      });

      if (pageInfo.endCursor) {
        params.set("after", pageInfo.endCursor);
      }

      const response = await fetch(`/api/blog?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Blog load failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        posts: BlogPost[];
        pageInfo: BlogPostsPageInfo;
      };

      setPosts((current) => mergePosts(current, data.posts));
      setPageInfo(data.pageInfo);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, locale, pageInfo.endCursor, pageInfo.hasNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !pageInfo.hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore, pageInfo.hasNextPage]);

  return (
    <>
      <BlogPageHeader copy={copy}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={blogFilterBadgeClassName(activeCategory === "All")}
          >
            {copy.all}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={blogFilterBadgeClassName(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </BlogPageHeader>

      <section aria-label={copy.featuredArticle} className="bg-moto">
        <div className="site-container py-10 lg:py-14">
          {featured ? (
            <BlogCard
              post={featured}
              variant="feature"
              priority
              locale={locale}
              copy={copy}
            />
          ) : (
            <p className="text-ink/60">{copy.noArticlesCategory}</p>
          )}
        </div>
      </section>

      {rest.length > 0 ? (
        <section aria-label={copy.moreArticles} className="bg-paper py-16 lg:py-24">
          <div className="site-container">
            <div className="mb-10 flex items-end justify-between gap-6 lg:mb-14">
              <div>
                <p className="section-eyebrow">{copy.moreStories}</p>
                <h2 className="mt-3 font-body text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
                  {copy.fromJournal}
                </h2>
              </div>
              <p className="hidden sm:block">
                <BlogBadge>
                  {rest.length}{" "}
                  {rest.length === 1 ? copy.article : copy.articles}
                </BlogBadge>
              </p>
            </div>
            <BlogCardGrid posts={rest} locale={locale} copy={copy} />
          </div>
        </section>
      ) : null}

      {pageInfo.hasNextPage || isLoading || loadError ? (
        <div className="site-container pb-16 lg:pb-24">
          <div
            ref={sentinelRef}
            className="flex flex-col items-center gap-4 pt-2"
            aria-live="polite"
          >
            {isLoading ? (
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                {copy.loadingArticles}
              </p>
            ) : null}
            {loadError ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                className="rounded-full border border-ink/20 bg-white px-8 py-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {copy.tryAgain}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
