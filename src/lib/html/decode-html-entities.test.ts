import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "@/lib/html/decode-html-entities";
import { parseMotorcycleShortDescription } from "@/lib/shop/parse-brixton-html";

describe("decodeHtmlEntities", () => {
  it("decodes WordPress en-dash entity", () => {
    expect(decodeHtmlEntities("uue ajastu &#8211; DRAKON125")).toBe(
      "uue ajastu – DRAKON125",
    );
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("Tom&apos;s &amp; Co")).toBe("Tom's & Co");
  });

  it("decodes WordPress curly quote entities to straight quotes", () => {
    expect(decodeHtmlEntities('Nahkjope &#8220;Botany&#8221; on osa.')).toBe(
      'Nahkjope "Botany" on osa.',
    );
  });

  it("decodes double-encoded entities", () => {
    expect(decodeHtmlEntities("Nahkjope &amp;#8220;Botany&amp;#8221;")).toBe(
      'Nahkjope "Botany"',
    );
  });
});

describe("parseMotorcycleShortDescription", () => {
  it("decodes entities in tagline text", () => {
    const parsed = parseMotorcycleShortDescription(
      "<h2>Saame tutvustada &#8211; DRAKON125</h2>",
      "et",
    );

    expect(parsed.tagline).toBe("Saame tutvustada – DRAKON125");
  });
});
