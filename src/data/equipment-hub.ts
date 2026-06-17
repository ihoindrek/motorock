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
    href: "/shop/equipment/helmets",
    image: "/equipment-helmets.webp",
    imageAlt: "Motorcycle helmet",
  },
  {
    id: "men",
    index: "02",
    title: "Men's gear",
    titleLines: ["Men's", "gear"],
    description: "Jackets, vests, pants, gloves — built for the ride.",
    href: "/shop/equipment/men",
    image: "/Brando-22.webp",
    imageAlt: "Men's motorcycle riding gear",
  },
  {
    id: "women",
    index: "03",
    title: "Women's gear",
    titleLines: ["Women's", "gear"],
    description: "Gear designed for riders who refuse to blend in.",
    href: "/shop/equipment/women",
    image: "/Motogirl_17_sept_edited_sized_for_website74-re6v5j7w.webp",
    imageAlt: "Women's motorcycle riding gear",
  },
  {
    id: "accessories",
    index: "04",
    title: "Accessories",
    titleLines: ["Accessories"],
    description: "Goggles, bags, headwear, and the finishing details.",
    href: "/shop/equipment/accessories",
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

export const equipmentHubBrands = [
  { name: "Pando Moto", href: "/shop/brands/pando-moto" },
  { name: "Holyfreedom", href: "/shop/brands/holyfreedom" },
  { name: "Johnny Reb", href: "/shop/brands/johnny-reb" },
  { name: "Motogirl", href: "/shop/brands/motogirl" },
] as const;
