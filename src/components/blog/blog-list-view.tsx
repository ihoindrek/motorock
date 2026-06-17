import { BlogListContent } from "@/components/blog/blog-list-content";
import type { BlogPostsPageInfo } from "@/lib/blog/posts";
import type { BlogPost } from "@/types/blog-post";

type BlogListViewProps = {
  initialPosts: readonly BlogPost[];
  initialPageInfo: BlogPostsPageInfo;
  categories: readonly string[];
};

export function BlogListView({
  initialPosts,
  initialPageInfo,
  categories,
}: BlogListViewProps) {
  if (initialPosts.length === 0) {
    return (
      <section className="bg-paper py-16">
        <div className="site-container">
          <p className="text-ink/60">No articles yet. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <BlogListContent
      initialPosts={initialPosts}
      initialPageInfo={initialPageInfo}
      categories={categories}
    />
  );
}
