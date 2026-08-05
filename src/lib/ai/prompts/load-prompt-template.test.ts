import { describe, expect, it } from "vitest";
import {
  clearPromptTemplateCache,
  getPromptTemplate,
  PROMPT_TEMPLATE_IDS,
} from "@/lib/ai/prompts/load-prompt-template";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";

describe("loadPromptTemplate", () => {
  it("loads every registered template from YAML", () => {
    clearPromptTemplateCache();

    for (const id of PROMPT_TEMPLATE_IDS) {
      const template = getPromptTemplate(id);
      expect(template.id).toBe(id);
      expect(template.system.trim().length).toBeGreaterThan(20);
      expect(template.user.trim().length).toBeGreaterThan(20);
      expect(template.locales).toContain("en");
      expect(template.locales).toContain("et");
    }
  });

  it("appends YAML rules to the system prompt for description", () => {
    clearPromptTemplateCache();

    const template = getPromptTemplate("description.v1");
    expect(template.system).toContain("Rules:");
    expect(template.system).toContain("no superlatives");
  });

  it("interpolates template variables", () => {
    clearPromptTemplateCache();

    const template = getPromptTemplate("seo.v1");
    const rendered = renderPromptTemplate(template, {
      locale: "et",
      name: "Bobber 125",
      brand: "Brixton",
      categoryPath: "motorcycles > 125cc",
      price: "3999",
      existingShort: "<p>Compact urban bobber.</p>",
      inStock: "true",
      attributesJson: "{}",
      variationCount: "2",
      productType: "motorcycle",
      imagesJson: "[]",
    });

    expect(rendered.system).toContain("Motorock.eu");
    expect(rendered.user).toContain("Bobber 125");
    expect(rendered.user).toContain("3999 EUR");
  });

  it("throws for unknown template ids", () => {
    expect(() => getPromptTemplate("missing.v1")).toThrow(
      "Unknown prompt template: missing.v1",
    );
  });
});
