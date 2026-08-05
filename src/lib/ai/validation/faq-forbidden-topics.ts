const FORBIDDEN_TOPIC_PATTERNS = [
  // Stock / availability (EN)
  /\bin\s+stock\b/i,
  /\bout\s+of\s+stock\b/i,
  /\bcurrently\s+available\b/i,
  /\bavailable\s+now\b/i,
  /\bis\s+it\s+available\b/i,
  /\bstock\s+(level|status|availability)\b/i,
  // Stock / availability (ET)
  /\blaos\b/iu,
  /\blaovarud\b/iu,
  /\bsaadaval\b/iu,
  /\bolemas\s+(esinduses|poes|letis|kohal)\b/iu,
  /\besinduses\s+(saadaval|olemas|kohal)\b/iu,
  /\bkas\s+.*\s+(laos|saadaval|esinduses)\b/iu,
  // Showroom / try-on / test ride
  /\bshowroom\b/i,
  /\besindus(?:es|e)?\b/iu,
  /\btest\s+ride\b/i,
  /\bproovisõit\b/iu,
  /\bproovida\b/iu,
  /\btry\s+(it\s+)?on\b/i,
  /\btry\s+before\b/i,
  /\bvisit\s+(the\s+)?(showroom|store)\b/i,
  /\bkülasta(?:da|ge)?\s+(esindust|poodi)\b/iu,
  /\bcan\s+i\s+(try|see|visit)\b/i,
  // Delivery tied to current availability
  /\bhow\s+(fast|quick|soon)\b.*\b(deliver|ship|shipping)\b/i,
  /\b\d+\s*[–-]\s*\d+\s+business\s+days\b/i,
  /\bkui\s+kiiresti\b.*\b(kohale|kohaletoimet|tarne)\b/iu,
  /\btarn(?:e|itakse)\s+\d+/iu,
];

/** FAQ must not promise stock, showroom presence, or delivery based on current availability. */
export function isForbiddenFaqTopic(question: string, answer: string) {
  const text = `${question}\n${answer}`;

  return FORBIDDEN_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}

export function filterForbiddenFaqItems<
  T extends { question: string; answer: string },
>(items: readonly T[]) {
  const kept: T[] = [];
  const removed: T[] = [];

  for (const item of items) {
    if (isForbiddenFaqTopic(item.question, item.answer)) {
      removed.push(item);
    } else {
      kept.push(item);
    }
  }

  return { kept, removed };
}
