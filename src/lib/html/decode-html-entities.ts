const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  hellip: "…",
};

/** Common WordPress numeric entities → readable plain-text punctuation. */
const NUMERIC_ENTITY_REPLACEMENTS: Record<number, string> = {
  34: '"',
  39: "'",
  160: " ",
  8211: "–",
  8212: "—",
  8216: "'",
  8217: "'",
  8220: '"',
  8221: '"',
  8230: "…",
};

function decodeHtmlEntitiesOnce(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return (
        NUMERIC_ENTITY_REPLACEMENTS[code] ?? String.fromCodePoint(code)
      );
    })
    .replace(/&#(\d+);/g, (_, code) => {
      const numeric = Number(code);
      return (
        NUMERIC_ENTITY_REPLACEMENTS[numeric] ?? String.fromCodePoint(numeric)
      );
    })
    .replace(/&([a-z]+);/gi, (match, name: string) => {
      const key = name.toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key]! : match;
    });
}

/** Decode common WordPress / Woo HTML entities for plain-text display. */
export function decodeHtmlEntities(value: string) {
  let result = value;

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decodeHtmlEntitiesOnce(result);
    if (next === result) {
      break;
    }
    result = next;
  }

  return result;
}
