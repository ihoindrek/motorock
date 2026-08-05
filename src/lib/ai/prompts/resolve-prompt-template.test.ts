import { describe, expect, it } from "vitest";
import { resolvePromptTemplateId } from "@/lib/ai/prompts/resolve-prompt-template";
import { getPromptTemplate } from "@/lib/ai/prompts/load-prompt-template";

describe("resolvePromptTemplateId", () => {
  it("uses motorcycle templates for motorcycle products", () => {
    expect(resolvePromptTemplateId("description", "motorcycle")).toBe(
      "description.motorcycle.v1",
    );
    expect(resolvePromptTemplateId("seo", "motorcycle")).toBe("seo.motorcycle.v1");
    expect(resolvePromptTemplateId("faq", "motorcycle")).toBe("faq.motorcycle.v1");
    expect(resolvePromptTemplateId("alt_text", "motorcycle")).toBe("alt_text.v1");
  });

  it("uses default templates for equipment products", () => {
    expect(resolvePromptTemplateId("description", "equipment")).toBe("description.v1");
    expect(resolvePromptTemplateId("seo", "equipment")).toBe("seo.v1");
    expect(resolvePromptTemplateId("faq", "equipment")).toBe("faq.v1");
    expect(resolvePromptTemplateId("alt_text", "equipment")).toBe("alt_text.v1");
  });

  it("loads motorcycle description template with motorcycle-specific rules", () => {
    const template = getPromptTemplate("description.motorcycle.v1");
    expect(template.system).toContain("motorcycle dealer");
    expect(template.system).toContain("riding character");
    expect(template.user).toContain("{{productType}}");
  });
});
