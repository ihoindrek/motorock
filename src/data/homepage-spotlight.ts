import type { Locale } from "@/i18n/config";
import type { ProductCategory } from "@/types/catalog-product";
import { buildEquipmentCategoryHref } from "@/lib/shop/category-url";

export type HomepageSpotlightConfig = {
  id: string;
  categories: readonly ProductCategory[];
  wcCategorySlugs: readonly string[];
  brands?: readonly string[];
  limit: number;
  copy: Record<
    Locale,
    {
      eyebrow: string;
      title: string;
      cta: string;
    }
  >;
  categoryHref: Record<Locale, string>;
};

/** Summer spotlight — swap to {@link HOMEPAGE_SPOTLIGHT_HOODIES} in autumn. */
export const HOMEPAGE_SPOTLIGHT_TSHIRTS = {
  id: "tshirts",
  categories: ["t-shirts"],
  wcCategorySlugs: ["t-shirts", "t-shirts-jerseys"],
  limit: 8,
  copy: {
    et: {
      eyebrow: "T-särgid",
      title: "Vali oma t-särk!",
      cta: "Vaata t-särke →",
    },
    en: {
      eyebrow: "T-shirts",
      title: "Choose your tee!",
      cta: "Shop t-shirts →",
    },
  },
  categoryHref: {
    et: buildEquipmentCategoryHref("et", "meestele", "t-sargid-ja-sargid"),
    en: buildEquipmentCategoryHref("en", "for-men", "t-shirts"),
  },
} satisfies HomepageSpotlightConfig;

/** Autumn spotlight — set as {@link ACTIVE_HOMEPAGE_SPOTLIGHT} when season changes. */
export const HOMEPAGE_SPOTLIGHT_HOODIES = {
  id: "hoodies",
  categories: ["hoodies"],
  wcCategorySlugs: ["hoodies", "hoodies-sweatshirts", "sweaters"],
  limit: 8,
  copy: {
    et: {
      eyebrow: "Kapuutsid",
      title: "Vali oma kapuuts!",
      cta: "Vaata kapuutse →",
    },
    en: {
      eyebrow: "Hoodies",
      title: "Choose your hoodie!",
      cta: "Shop hoodies →",
    },
  },
  categoryHref: {
    et: buildEquipmentCategoryHref("et", "meestele", "kapuutsid-ja-kampsunid"),
    en: buildEquipmentCategoryHref("en", "for-men", "sweaters"),
  },
} satisfies HomepageSpotlightConfig;

export const HOMEPAGE_SPOTLIGHT_BEST_SELLERS = {
  id: "best-sellers",
  categories: ["jackets", "helmets", "gloves", "pants", "vests", "safety"],
  wcCategorySlugs: [
    "jackets-and-tags",
    "jakid-ja-tagid",
    "helmets",
    "kiivrid",
    "gloves",
    "kindad",
    "protection",
    "kaitse",
    "pants",
    "püksid",
    "vests",
    "safety",
  ],
  limit: 8,
  copy: {
    et: {
      eyebrow: "Enimmüüdud",
      title: "Top turvavarustus",
      cta: "Vaata kaitsevarustust →",
    },
    en: {
      eyebrow: "Best sellers",
      title: "Top protected gear",
      cta: "Shop protection →",
    },
  },
  categoryHref: {
    et: buildEquipmentCategoryHref("et", "protection"),
    en: buildEquipmentCategoryHref("en", "protection"),
  },
} satisfies HomepageSpotlightConfig;

export const ACTIVE_HOMEPAGE_SPOTLIGHT = HOMEPAGE_SPOTLIGHT_BEST_SELLERS;
