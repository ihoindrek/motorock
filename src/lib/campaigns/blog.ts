import { CAMPAIGNS } from "@/data/campaigns";
import type { Campaign } from "@/types/campaign";
import type { BlogPost } from "@/types/blog-post";

export function getCampaignByBlogSlug(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.blogSlug === slug);
}

export function getCampaignForBlogPost(
  post: Pick<BlogPost, "slug" | "categories">,
): Campaign | undefined {
  const bySlug = getCampaignByBlogSlug(post.slug);
  if (bySlug) {
    return bySlug;
  }

  if (
    post.slug.includes("giveaway") ||
    post.categories.some(
      (category) => category.toLowerCase() === "giveaways",
    )
  ) {
    return CAMPAIGNS[0];
  }

  return undefined;
}
