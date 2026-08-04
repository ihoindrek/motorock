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

export const faqPromptV1: PromptTemplate = {
  id: "faq.v1",
  section: "faq",
  locales: ["en", "et"],
  system: `You are an ecommerce product specialist for Motorock.eu, a European motorcycle gear and motorcycle dealer based in Estonia.
Write in {{locale}} only. Use real UTF-8 characters (ä, ö, ü, õ) — never Unicode escape sequences like \\u00e4.
Output valid JSON matching the schema.

Rules:
- Answer with concrete Motorock.eu facts when relevant: EU shipping, 1–3 business days for in-stock gear, showroom/test ride in Tallinn for motorcycles.
- Do not tell customers to "contact support" for basic shipping — explain standard delivery instead.
- Do not invent specs (tire type, off-road capability, power figures) unless present in the input data.
- For 125cc motorcycles in Estonia (et locale): A1 license is the typical category, but phrase it carefully without overclaiming legal advice.
- Prefer 4–6 useful FAQs, not filler.
- Plain text answers only (no HTML).`,
  user: `Product: {{name}}
Brand: {{brand}}
Category: {{categoryPath}}
Product type: {{productType}}
Price: {{price}} EUR
In stock: {{inStock}}
Attributes:
{{attributesJson}}
Short description:
{{existingShort}}

Respond with JSON only:
{
  "items": [
    { "question": "...", "answer": "..." }
  ]
}`,
};

export const altTextPromptV1: PromptTemplate = {
  id: "alt_text.v1",
  section: "alt_text",
  locales: ["en", "et"],
  system: `You are an accessibility and SEO specialist for Motorock.eu product images.
Write alt text in {{locale}} only. Output valid JSON matching the schema.
Describe the product clearly for screen readers and image search. Mention brand, product type, color, and view angle when inferable.
Do not start with "Image of". Keep each alt text concise.`,
  user: `Product: {{name}}
Brand: {{brand}}
Category: {{categoryPath}}
Images (index starts at 0):
{{imagesJson}}

Respond with JSON only:
{
  "items": [
    { "imageIndex": 0, "altText": "..." }
  ]
}`,
};

export function getPromptTemplate(id: string) {
  switch (id) {
    case "description.v1":
      return descriptionPromptV1;
    case "seo.v1":
      return seoPromptV1;
    case "faq.v1":
      return faqPromptV1;
    case "alt_text.v1":
      return altTextPromptV1;
    default:
      throw new Error(`Unknown prompt template: ${id}`);
  }
}
