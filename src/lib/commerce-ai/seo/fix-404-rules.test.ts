import { describe, expect, it } from "vitest";
import {
  isIgnorableBrokenUrl,
  suggestRuleBasedRedirect,
} from "@/lib/commerce-ai/seo/fix-404-rules";

describe("fix-404-rules", () => {
  it("ignores feeds and font junk", () => {
    expect(isIgnorableBrokenUrl("/feed/")).toBe(true);
    expect(isIgnorableBrokenUrl("/montserratnormal700100u0-10ffff/")).toBe(true);
    expect(isIgnorableBrokenUrl("/en/shop/motron")).toBe(false);
  });

  it("maps legacy shop brand slugs", () => {
    const match = suggestRuleBasedRedirect("/shop/brixton", "en", [
      {
        type: "category",
        title: "Brixton",
        slug: "brixton",
        url: "/en/brand/brixton",
      },
    ]);

    expect(match?.to).toBe("/en/brand/brixton");
    expect(match?.confidence).toBe("high");
  });

  it("maps motron to motorcycles hub", () => {
    const match = suggestRuleBasedRedirect("/en/shop/motron", "en", []);
    expect(match?.to).toContain("/shop/motorcycles");
  });
});
