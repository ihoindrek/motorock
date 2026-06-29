import type { Locale } from "@/i18n/config";
import { buildEquipmentCategoryHref } from "@/lib/shop/equipment-route";

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

export const equipmentHubCategories = [
  {
    id: "helmets",
    index: "01",
    title: "Helmets",
    titleLines: ["Helmets"],
    description: "Retro lids, open-face classics, and full protection.",
    href: buildEquipmentCategoryHref("helmets"),
    image: "/equipment-helmets.webp",
    imageAlt: "Motorcycle helmet",
  },
  {
    id: "men",
    index: "02",
    title: "Men's gear",
    titleLines: ["Men's", "gear"],
    description: "Jackets, vests, pants, gloves — built for the ride.",
    href: buildEquipmentCategoryHref("for-men"),
    image: "/Brando-22.webp",
    imageAlt: "Men's motorcycle riding gear",
  },
  {
    id: "women",
    index: "03",
    title: "Women's gear",
    titleLines: ["Women's", "gear"],
    description: "Gear designed for riders who refuse to blend in.",
    href: buildEquipmentCategoryHref("for-women"),
    image: "/Motogirl_17_sept_edited_sized_for_website74-re6v5j7w.webp",
    imageAlt: "Women's motorcycle riding gear",
  },
  {
    id: "accessories",
    index: "04",
    title: "Accessories",
    titleLines: ["Accessories"],
    description: "Goggles, bags, headwear, and the finishing details.",
    href: buildEquipmentCategoryHref("accessories"),
    image: "/backpack-bushcraft-4.webp",
    imageAlt: "Motorcycle backpack",
  },
  {
    id: "tools",
    index: "05",
    title: "Tools & maintenance",
    titleLines: ["Tools &", "maintenance"],
    description: "Workshop essentials to keep your machine road-ready.",
    href: "/shop/tools",
    image: "/hero-may-ggh01z.webp",
    imageAlt: "Motorcycle workshop tools",
  },
] as const satisfies readonly EquipmentHubCategory[];

const equipmentHubCategoriesEt: readonly EquipmentHubCategory[] = [
  {
    id: "helmets",
    index: "01",
    title: "Kiivrid",
    titleLines: ["Kiivrid"],
    description: "Retro kiivrid, open-face klassikud ja täiskaitse.",
    href: buildEquipmentCategoryHref("helmets"),
    image: "/equipment-helmets.webp",
    imageAlt: "Mootorrattakiiver",
  },
  {
    id: "men",
    index: "02",
    title: "Meeste varustus",
    titleLines: ["Meeste", "varustus"],
    description: "Joped, vestid, püksid, kindad — loodud sõiduks.",
    href: buildEquipmentCategoryHref("for-men"),
    image: "/Brando-22.webp",
    imageAlt: "Meeste mootorrattavarustus",
  },
  {
    id: "women",
    index: "03",
    title: "Naiste varustus",
    titleLines: ["Naiste", "varustus"],
    description: "Varustus sõitjatele, kes ei taha massi sulanduda.",
    href: buildEquipmentCategoryHref("for-women"),
    image: "/Motogirl_17_sept_edited_sized_for_website74-re6v5j7w.webp",
    imageAlt: "Naiste mootorrattavarustus",
  },
  {
    id: "accessories",
    index: "04",
    title: "Aksessuaarid",
    titleLines: ["Aksessuaarid"],
    description: "Prillid, kotid, peakated ja viimistlevad detailid.",
    href: buildEquipmentCategoryHref("accessories"),
    image: "/backpack-bushcraft-4.webp",
    imageAlt: "Mootorrattaseljakott",
  },
  {
    id: "tools",
    index: "05",
    title: "Tööriistad ja hooldus",
    titleLines: ["Tööriistad", "ja hooldus"],
    description: "Töökoja hädavajalik, et ratas oleks alati teevalmis.",
    href: "/shop/tools",
    image: "/hero-may-ggh01z.webp",
    imageAlt: "Mootorratta tööriistad",
  },
];

export const equipmentHubCopy = {
  eyebrow: "Shop",
  title: "Driving",
  accent: "Equipment",
  description:
    "Layers, lids, and rebel essentials — curated for riders who refuse to blend in.",
  outline: "Ride ready",
  heroImage:
    "https://motorock.eu/wp-content/uploads/2026/06/Capo-Cor-02-Black-1-1_fcc5dbe4-95fc-4a09-bcd0-f7a42c5dd699.jpg",
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
    "https://motorock.eu/wp-content/uploads/2026/06/Capo-Cor-02-Black-1-1_fcc5dbe4-95fc-4a09-bcd0-f7a42c5dd699.jpg",
  heroImageAlt: "Capo Cor turvasärk meestele",
} as const;

export const equipmentHubBrands = [
  { name: "Pando Moto", href: "/shop/brands/pando-moto" },
  { name: "Holyfreedom", href: "/shop/brands/holyfreedom" },
  { name: "Johnny Reb", href: "/shop/brands/johnny-reb" },
  { name: "Motogirl", href: "/shop/brands/motogirl" },
] as const;

export function getEquipmentHubData(locale: Locale) {
  return {
    categories: locale === "et" ? equipmentHubCategoriesEt : equipmentHubCategories,
    copy: locale === "et" ? equipmentHubCopyEt : equipmentHubCopy,
    brands: equipmentHubBrands,
  };
}
