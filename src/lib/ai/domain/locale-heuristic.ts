import type { Locale } from "@/i18n/config";

export function matchesLocaleHeuristic(text: string, locale: Locale) {
  const sample = text.toLowerCase();

  if (locale === "et") {
    return /[äöüõ]/.test(sample) || /\b(ja|või|ning|le|on|jaoks)\b/.test(sample);
  }

  return !/[äöüõ]/.test(sample) || /\b(the|and|for|with|your)\b/.test(sample);
}
