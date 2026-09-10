import { describe, expect, it } from "vitest";

/** Mirrors normalizeBrokenUrls logic for unit testing. */
function normalizeBrokenUrls(input: string | string[] | undefined): string[] {
  const raw =
    typeof input === "string"
      ? input.split(/\r?\n/)
      : Array.isArray(input)
        ? input
        : [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const line of raw) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let path = trimmed;
    try {
      if (trimmed.startsWith("http")) {
        path = new URL(trimmed).pathname;
      }
    } catch {
      // Keep as-is.
    }

    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    if (!seen.has(path)) {
      seen.add(path);
      normalized.push(path);
    }
  }

  return normalized;
}

describe("404 URL normalization", () => {
  it("strips domain and deduplicates", () => {
    expect(
      normalizeBrokenUrls(
        "https://motorock.eu/en/product/old\n/en/product/old\net/toode/vana",
      ),
    ).toEqual(["/en/product/old", "/et/toode/vana"]);
  });

  it("returns empty for blank input", () => {
    expect(normalizeBrokenUrls("\n  \n")).toEqual([]);
  });
});
