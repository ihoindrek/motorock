import type { PromptTemplate } from "@/lib/ai/prompts/prompt-renderer";

export const descriptionPromptV1: PromptTemplate = {
  id: "description.v1",
  section: "description",
  locales: ["en", "et"],
  system: `You are an ecommerce copywriter for Motorock.eu, a European motorcycle gear store.
Write in {{locale}} only. Output valid JSON matching the schema.
Use HTML in descriptions. Be factual — do not invent specs not in the input.
Do not include specification tables or technical spec lists in the description — specs are shown separately on the product page.`,
  user: `Product: {{name}}
Brand: {{brand}}
Category: {{categoryPath}}
Price: {{price}} EUR
In stock: {{inStock}}
Attributes:
{{attributesJson}}
Variations: {{variationCount}}
Existing short description (may be empty):
{{existingShort}}

Respond with JSON only:
{
  "shortDescription": "<p>...</p>",
  "description": "<h2>...</h2><p>...</p>"
}`,
};

export const seoPromptV1: PromptTemplate = {
  id: "seo.v1",
  section: "seo",
  locales: ["en", "et"],
  system: `You are an SEO specialist for Motorock.eu.
Write in {{locale}} only. Output valid JSON matching the schema.
Do not include the site suffix "| Motorock.eu" in the title.`,
  user: `Product: {{name}}
Brand: {{brand}}
Category: {{categoryPath}}
Price: {{price}} EUR
Short description context:
{{existingShort}}

Respond with JSON only:
{
  "title": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."]
}`,
};

export function getPromptTemplate(id: string) {
  switch (id) {
    case "description.v1":
      return descriptionPromptV1;
    case "seo.v1":
      return seoPromptV1;
    default:
      throw new Error(`Unknown prompt template: ${id}`);
  }
}
