import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { en } from "@/i18n/dictionaries/en";
import { et } from "@/i18n/dictionaries/et";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  et,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
