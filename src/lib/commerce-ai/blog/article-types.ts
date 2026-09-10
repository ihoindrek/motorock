/** Article structure presets for the blog generator. */
export const BLOG_ARTICLE_TYPES = [
  "gear_guide",
  "top_list",
  "how_to",
  "brand_story",
  "news",
] as const;

export type BlogArticleType = (typeof BLOG_ARTICLE_TYPES)[number];

export function isBlogArticleType(value: unknown): value is BlogArticleType {
  return (
    typeof value === "string" &&
    (BLOG_ARTICLE_TYPES as readonly string[]).includes(value)
  );
}

const ARTICLE_TYPE_INSTRUCTIONS: Record<BlogArticleType, string> = {
  gear_guide: [
    "Structure: buying guide.",
    "Open with who the guide is for and the riding conditions it covers.",
    "Organize sections by gear category or use case (h2 per section).",
    "For each section explain what matters when choosing (fit, protection, materials, weather) before recommending products.",
    "Close with a short checklist summary.",
  ].join(" "),
  top_list: [
    "Structure: numbered top list (e.g. Top 5).",
    "Open with the selection criteria in 1-2 paragraphs.",
    "Each list item is an h2 like \"1. Product or theme name\" with 2-3 paragraphs: what it is, why it made the list, who it suits.",
    "Base list items on the provided catalog products when available.",
    "Close with a verdict paragraph naming the overall pick.",
  ].join(" "),
  how_to: [
    "Structure: practical how-to tutorial.",
    "Open by stating the goal, difficulty, and time needed.",
    "Use numbered step headings (h2) in doing order; each step says what to do, how, and common mistakes.",
    "Mention needed tools or gear at the start, linking catalog products when relevant.",
    "Close with a maintenance or next-steps tip.",
  ].join(" "),
  brand_story: [
    "Structure: brand story feature.",
    "Open with what makes the brand distinctive in one strong paragraph.",
    "Cover heritage/history, design philosophy, and what riders love about it — one h2 section each.",
    "Weave the provided catalog products in as concrete examples of the brand's approach.",
    "Close with why Motorock carries the brand and who should try it.",
  ].join(" "),
  news: [
    "Structure: store/announcement news article.",
    "Lead with the news itself in the first paragraph (what, when, for whom).",
    "Add context and practical details in following sections.",
    "Keep it shorter and punchier than a guide — 500-800 words is fine.",
    "Close with a clear call to action.",
  ].join(" "),
};

export function articleTypeInstructions(type: BlogArticleType | undefined) {
  if (!type) {
    return "Structure: freeform journal article with a clear narrative arc.";
  }

  return ARTICLE_TYPE_INSTRUCTIONS[type];
}
