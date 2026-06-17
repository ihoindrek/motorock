import { getCampaignForBlogPost } from "@/lib/campaigns/blog";
import { GIVEAWAY_2026_SLUG } from "@/data/giveaway";
import type { BlogPost } from "@/types/blog-post";

/** @deprecated Prefer getCampaignForBlogPost from @/lib/campaigns/blog */
export function isGiveawayPost(
  post: Pick<BlogPost, "slug" | "categories">,
): boolean {
  return Boolean(getCampaignForBlogPost(post));
}

export { GIVEAWAY_2026_SLUG };
