import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";

const schema = z.object({ title: z.string() });

describe("GeminiProvider", () => {
  it("parses JSON content from Gemini response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: '{"title":"Gemini SEO"}' }] } }],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GeminiProvider("gemini-key", "gemini-2.0-flash");
    const result = await provider.completeJson({
      model: "gemini-2.0-flash",
      system: "system",
      user: "user",
      schema,
    });

    expect(result.data).toEqual({ title: "Gemini SEO" });
    expect(result.model).toBe("gemini-2.0-flash");
    expect(result.usage).toEqual({ promptTokens: 12, completionTokens: 8 });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "generativelanguage.googleapis.com",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });

    vi.unstubAllGlobals();
  });
});
