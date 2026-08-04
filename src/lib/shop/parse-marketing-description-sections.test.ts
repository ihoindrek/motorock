import { describe, expect, it } from "vitest";
import { parseMarketingDescriptionSections } from "@/lib/shop/parse-marketing-description-sections";

describe("parseMarketingDescriptionSections", () => {
  it("splits description HTML by h2 headings", () => {
    const sections = parseMarketingDescriptionSections(`
      <h2>Built for the Dirt</h2>
      <p>First paragraph.</p>
      <h2>Off-Road Capability</h2>
      <p>Second paragraph.</p>
      <ul><li>Feature one</li></ul>
    `);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe("Built for the Dirt");
    expect(sections[0]?.bodyHtml).toContain("First paragraph");
    expect(sections[1]?.title).toBe("Off-Road Capability");
    expect(sections[1]?.bodyHtml).toContain("Feature one");
  });

  it("returns single body block when no h2 exists", () => {
    const sections = parseMarketingDescriptionSections("<p>Plain overview copy.</p>");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe("");
    expect(sections[0]?.bodyHtml).toContain("Plain overview");
  });
});
