import { describe, expect, it } from "vitest";
import {
  extractLeadCopy,
  htmlToPlainText,
  resolveProductLeadCopy,
  splitSentences,
} from "@/lib/shop/product-lead-copy";

describe("htmlToPlainText", () => {
  it("decodes entities and strips tags", () => {
    expect(htmlToPlainText("Nahkjope &#8220;Botany&#8221; on osa.")).toBe(
      'Nahkjope "Botany" on osa.',
    );
  });
});

describe("splitSentences", () => {
  it("keeps full sentences", () => {
    expect(
      splitSentences(
        "Esimene lause. Teine lause! Kas kolmas?",
      ),
    ).toEqual(["Esimene lause.", "Teine lause!", "Kas kolmas?"]);
  });
});

describe("extractLeadCopy", () => {
  it("returns the full short description without character truncation", () => {
    const short =
      "<p>Nahkjope &#8220;Botany&#8221; on osa Johnny Reb Vintage kollektsioonist. Klassikaline disain, mis on valmistatud kvaliteetsest nahast.</p>";

    expect(extractLeadCopy(short)).toBe(
      'Nahkjope "Botany" on osa Johnny Reb Vintage kollektsioonist. Klassikaline disain, mis on valmistatud kvaliteetsest nahast.',
    );
  });

  it("falls back to complete sentences from long copy", () => {
    expect(
      extractLeadCopy("", {
        fallbackPlain:
          "Esimene lause on siin. Teine lause järgneb. Kolmas jääb välja.",
        fallbackMaxSentences: 2,
      }),
    ).toBe("Esimene lause on siin. Teine lause järgneb.");
  });
});

describe("resolveProductLeadCopy", () => {
  it("prefers parsed taglines", () => {
    expect(
      resolveProductLeadCopy("Parsed tagline.", "", "Fallback text."),
    ).toBe("Parsed tagline.");
  });
});
