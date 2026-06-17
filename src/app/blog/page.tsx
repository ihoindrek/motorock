import { BlogListView } from "@/components/blog/blog-list-view";
import {
  getAllBlogPosts,
  getBlogCategories,
  getBlogPostsPage,
  BLOG_INITIAL_PAGE_SIZE,
} from "@/lib/blog/posts";

export const metadata = {
  title: "Blog",
  description:
    "Garage notes, gear guides, and motorcycle culture from Motorock.eu.",
};

export const revalidate = 300;

export default async function BlogPage() {
  const [initialPage, allPosts] = await Promise.all([
    getBlogPostsPage({ first: BLOG_INITIAL_PAGE_SIZE }),
    getAllBlogPosts(),
  ]);

  return (
    <BlogListView
      initialPosts={initialPage.posts}
      initialPageInfo={initialPage.pageInfo}
      categories={getBlogCategories(allPosts)}
    />
  );
}
