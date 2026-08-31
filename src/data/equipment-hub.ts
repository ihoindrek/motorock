import type { Locale } from "@/i18n/config";
import type { EquipmentNavTree, WcCategoryEntry, WcCategoryNode } from "@/lib/graphql/categories";
import { getCategoryImage, getLocalizedCategoryName } from "@/lib/graphql/categories";
import { buildEquipmentRootCategoryHref } from "@/lib/shop/equipment-route";
import {
  buildShopCategoryHref,
  buildToolsCategoryHref,
} from "@/lib/shop/shop-category-route";

export type EquipmentHubCategory = {
  id: string;
  index: string;
  title: string;
  titleLines?: readonly string[];
  description: string;
  href: string;
  image: string;
  imageAlt: string;
};

type HubPresentation = {
  id: string;
  wcSlug: string;
  image: string;
  description: { en: string; et: string };
  imageAlt: { en: string; et: string };
  titleLines?: { en: readonly string[]; et: readonly string[] };
};

const HUB_PRESENTATION: readonly HubPresentation[] = [
  {
    id: "helmets",
    wcSlug: "helmets",
    image: "/equipment-helmets.webp",
    description: {
      en: "Retro lids, open-face classics, and full protection.",
      et: "Retro kiivrid, open-face klassikud ja täiskaitse.",
    },
    imageAlt: {
      en: "Motorcycle helmet",
      et: "Mootorrattakiiver",
    },
    titleLines: {
      en: ["Helmets"],
      et: ["Kiivrid"],
    },
  },
  {
    id: "men",
    wcSlug: "for-men",
    image: "/Brando-22.webp",
    description: {
      en: "Jackets, vests, pants, gloves — built for the ride.",
      et: "Joped, vestid, püksid, kindad — loodud sõiduks.",
    },
    imageAlt: {
      en: "Men's motorcycle riding gear",
      et: "Meeste mootorrattavarustus",
    },
    titleLines: {
      en: ["Men's", "gear"],
      et: ["Meeste", "varustus"],
    },
  },
  {
    id: "women",
    wcSlug: "for-women",
    image: "/Motogirl_17_sept_edited_sized_for_website74-re6v5j7w.webp",
    description: {
      en: "Gear designed for riders who refuse to blend in.",
      et: "Varustus sõitjatele, kes ei taha massi sulanduda.",
    },
    imageAlt: {
      en: "Women's motorcycle riding gear",
      et: "Naiste mootorrattavarustus",
    },
    titleLines: {
      en: ["Women's", "gear"],
      et: ["Naiste", "varustus"],
    },
  },
  {
    id: "accessories",
    wcSlug: "accessories",
    image: "/backpack-bushcraft-4.webp",
    description: {
      en: "Goggles, bags, headwear, and the finishing details.",
      et: "Prillid, kotid, peakated ja viimistlevad detailid.",
    },
    imageAlt: {
      en: "Motorcycle backpack",
      et: "Mootorrattaseljakott",
    },
    titleLines: {
      en: ["Accessories"],
      et: ["Aksessuaarid"],
    },
  },
];

const TOOLS_HUB: EquipmentHubCategory = {
  id: "tools",
  index: "05",
  title: "Tools & maintenance",
  titleLines: ["Tools &", "maintenance"],
  description: "Workshop essentials to keep your machine road-ready.",
  href: buildToolsCategoryHref("en"),
  image: "/hero-may-ggh01z.webp",
  imageAlt: "Motorcycle workshop tools",
};

const TOOLS_HUB_ET: EquipmentHubCategory = {
  ...TOOLS_HUB,
  title: "Tööriistad ja hooldus",
  titleLines: ["Tööriistad", "ja hooldus"],
  description: "Töökoja hädavajalik, et ratas oleks alati teevalmis.",
  imageAlt: "Mootorratta tööriistad",
};

function treeNodeForSlug(
  tree: EquipmentNavTree | null,
  wcSlug: string,
): WcCategoryNode | null {
  if (!tree) {
    return null;
  }

  switch (wcSlug) {
    case "for-men":
      return tree.forMen;
    case "for-women":
      return tree.forWomen;
    case "accessories":
      return tree.accessories;
    case "helmets":
      return tree.helmets;
    default:
      return null;
  }
}

export function buildEquipmentHubCategories(
  tree: EquipmentNavTree | null,
  locale: Locale,
  toolsCategory?: WcCategoryEntry | null,
): EquipmentHubCategory[] {
  const categories: EquipmentHubCategory[] = [];
  let index = 1;

  for (const presentation of HUB_PRESENTATION) {
    const node = treeNodeForSlug(tree, presentation.wcSlug);

    if (!node) {
      continue;
    }

    const title = getLocalizedCategoryName(node, locale);
    const { url, alt } = getCategoryImage(node, presentation.image);

    categories.push({
      id: presentation.id,
      index: String(index).padStart(2, "0"),
      title,
      titleLines: presentation.titleLines?.[locale],
      description: presentation.description[locale],
      href: buildEquipmentRootCategoryHref(node, presentation.wcSlug, locale),
      image: url,
      imageAlt: alt || presentation.imageAlt[locale],
    });
    index += 1;
  }

  if (locale === "et") {
    const toolsHub = locale === "et" ? TOOLS_HUB_ET : TOOLS_HUB;

    categories.push({
      ...toolsHub,
      title: toolsCategory
        ? getLocalizedCategoryName(toolsCategory, locale)
        : toolsHub.title,
      href: toolsCategory
        ? buildShopCategoryHref(toolsCategory, locale)
        : buildToolsCategoryHref(locale),
      index: String(index).padStart(2, "0"),
    });
  }

  return categories;
}

export const equipmentHubCopy = {
  eyebrow: "Shop",
  title: "Driving",
  accent: "Equipment",
  description:
    "Layers, lids, and rebel essentials — curated for riders who refuse to blend in.",
  outline: "Ride ready",
  heroImage:
    "https://shop.motorock.eu/wp-content/uploads/2026/06/Capo-Cor-02-Black-1-1_fcc5dbe4-95fc-4a09-bcd0-f7a42c5dd699.jpg",
  heroImageAlt: "Capo Cor armored motorcycle shirt for men",
} as const;

const equipmentHubCopyEt = {
  eyebrow: "Pood",
  title: "Sõidu",
  accent: "varustus",
  description:
    "Kihid, kiivrid ja mässulise sõitja hädavajalik — valitud neile, kes ei taha massi sulanduda.",
  outline: "Sõiduks valmis",
  heroImage:
    "https://shop.motorock.eu/wp-content/uploads/2026/06/Capo-Cor-02-Black-1-1_fcc5dbe4-95fc-4a09-bcd0-f7a42c5dd699.jpg",
  heroImageAlt: "Capo Cor turvasärk meestele",
} as const;

export const equipmentHubBrands = [
  {
    name: "Pando Moto",
    slug: "pando-moto",
    image: "/Small_DSC08744.webp",
    logo: "/PandoMoto.svg",
    logoInvert: true,
    imageAlt: {
      en: "Pando Moto riding gear",
      et: "Pando Moto sõiduvarustus",
    },
  },
  {
    name: "Holyfreedom",
    slug: "holyfreedom",
    image: "/tutonero.jpg",
    logo: "/HF-Wht.png",
    logoInvert: false,
    imageAlt: {
      en: "Holyfreedom motorcycle apparel",
      et: "Holyfreedom mootorrattariided",
    },
  },
  {
    name: "Johnny Reb",
    slug: "johnny-reb",
    image: "/JRF00001-1LS.webp",
    logo: "/johnny-reb.webp",
    logoInvert: false,
    imageAlt: {
      en: "Johnny Reb riding gear",
      et: "Johnny Reb sõiduvarustus",
    },
  },
  {
    name: "John Doe",
    slug: "john-doe",
    image: "/John-Doe-logo.svg",
    logo: "/John-Doe-logo.svg",
    logoInvert: false,
    imageAlt: {
      en: "John Doe motorcycle apparel",
      et: "John Doe mootorrattariided",
    },
  },
  {
    name: "Motogirl",
    slug: "motogirl",
    image: "/MotoGirl44.webp",
    logo: "/motogirl.png",
    logoInvert: false,
    imageAlt: {
      en: "Motogirl women's motorcycle gear",
      et: "Motogirl naiste mootorrattavarustus",
    },
  },
  {
    name: "Bobhead",
    slug: "bobhead",
    image: "/bobhead.png",
    logo: "/bobhead.avif",
    logoInvert: true,
    imageAlt: {
      en: "Bobhead helmets and riding gear",
      et: "Bobhead kiivrid ja sõiduvarustus",
    },
  },
] as const;

export type EquipmentHubBrand = (typeof equipmentHubBrands)[number];

export function getEquipmentHubData(
  locale: Locale,
  tree: EquipmentNavTree | null = null,
  toolsCategory?: WcCategoryEntry | null,
) {
  return {
    categories: buildEquipmentHubCategories(tree, locale, toolsCategory),
    copy: locale === "et" ? equipmentHubCopyEt : equipmentHubCopy,
    brands: equipmentHubBrands,
  };
}
