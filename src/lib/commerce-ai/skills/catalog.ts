import type { CommerceAiSkillDefinition } from "@/lib/commerce-ai/core/types";

export const COMMERCE_AI_SKILL_CATALOG: readonly CommerceAiSkillDefinition[] = [
  {
    id: "product.content_writer",
    domain: "product",
    status: "active",
    title: "Product content writer",
    description:
      "Generate product descriptions, SEO meta, FAQ, and image ALT text.",
  },
  {
    id: "content.blog_generate",
    domain: "content",
    status: "active",
    title: "Blog article generator",
    description: "Draft journal posts from a topic, product, or campaign brief.",
  },
  {
    id: "catalog.fill_attributes",
    domain: "catalog",
    status: "planned",
    title: "Fill missing attributes",
    description: "Suggest WooCommerce attributes for incomplete product records.",
  },
  {
    id: "catalog.related_products",
    domain: "catalog",
    status: "planned",
    title: "Related products",
    description: "Recommend and apply related product links in bulk.",
  },
  {
    id: "catalog.detect_duplicates",
    domain: "catalog",
    status: "planned",
    title: "Duplicate detection",
    description: "Find likely duplicate products by SKU, title, and images.",
  },
  {
    id: "catalog.organize_categories",
    domain: "catalog",
    status: "planned",
    title: "Category organizer",
    description: "Suggest category cleanup and WPML-safe taxonomy moves.",
  },
  {
    id: "seo.audit",
    domain: "seo",
    status: "planned",
    title: "SEO audit",
    description: "Score PDPs and posts for missing meta, thin content, and ALT gaps.",
  },
  {
    id: "seo.internal_links",
    domain: "seo",
    status: "planned",
    title: "Internal link suggestions",
    description: "Recommend internal links between products, categories, and blog posts.",
  },
  {
    id: "seo.fix_404",
    domain: "seo",
    status: "planned",
    title: "404 repair assistant",
    description: "Suggest redirects for broken URLs from crawl or GSC exports.",
  },
  {
    id: "intelligence.pricing",
    domain: "intelligence",
    status: "planned",
    title: "Pricing intelligence",
    description: "Compare competitor pricing and suggest margin-safe price updates.",
  },
  {
    id: "content.email_campaign",
    domain: "content",
    status: "planned",
    title: "Email & campaigns",
    description: "Draft newsletter and campaign copy from catalog highlights.",
  },
  {
    id: "support.cs_replies",
    domain: "support",
    status: "planned",
    title: "Customer support drafts",
    description: "Prepare support replies using order context and store policies.",
  },
];
