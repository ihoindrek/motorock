import type { AiContentSection } from "@/lib/ai/core/types";
import type { ProductType } from "@/types/catalog-product";

const MOTORCYCLE_PROMPTS: Record<AiContentSection, string> = {
  description: "description.motorcycle.v1",
  seo: "seo.motorcycle.v1",
  faq: "faq.motorcycle.v1",
  alt_text: "alt_text.v1",
};

const EQUIPMENT_PROMPTS: Record<AiContentSection, string> = {
  description: "description.v1",
  seo: "seo.v1",
  faq: "faq.v1",
  alt_text: "alt_text.v1",
};

export function resolvePromptTemplateId(
  section: AiContentSection,
  productType: ProductType,
): string {
  const prompts =
    productType === "motorcycle" ? MOTORCYCLE_PROMPTS : EQUIPMENT_PROMPTS;

  return prompts[section];
}
