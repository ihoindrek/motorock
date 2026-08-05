import { describe, expect, it } from "vitest";
import { extractJsonBlock } from "@/lib/ai/providers/extract-json-block";

describe("extractJsonBlock", () => {
  it("returns raw JSON object text", () => {
    expect(extractJsonBlock('{"title":"Test"}')).toBe('{"title":"Test"}');
  });

  it("extracts fenced JSON block", () => {
    expect(
      extractJsonBlock('Here is the payload:\n```json\n{"title":"Test"}\n```'),
    ).toBe('{"title":"Test"}');
  });
});
