import { BlogListContent } from "@/components/blog/blog-list-content";
import type { BlogPostsPageInfo } from "@/lib/blog/posts";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { BlogPost } from "@/types/blog-post";

type BlogListViewProps = {
  initialPosts: readonly BlogPost[];
  initialPageInfo: BlogPostsPageInfo;
  categories: readonly string[];
  locale: "en" | "et";
  copy: Dictionary["blog"];
};

export function BlogListView({
  initialPosts,
  initialPageInfo,
  categories,
  locale,
  copy,
}: BlogListViewProps) {
  if (initialPosts.length === 0) {
    return (
      <section className="bg-paper py-16">
        <div className="site-container">
          <p className="text-ink/60">{copy.noArticlesYet}</p>
        </div>
      </section>
    );
  }

  return (
    <BlogListContent
      initialPosts={initialPosts}
      initialPageInfo={initialPageInfo}
      categories={categories}
      locale={locale}
      copy={copy}
    />
  );
}
