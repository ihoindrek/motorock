export type BrandConfig = {
  name: string;
  slug: string;
  logo?: string;
  width?: number;
  height?: number;
  /** Product card / compact contexts */
  logoClass: string;
  /** Product page / larger contexts */
  logoClassLg: string;
};

export const brands: readonly BrandConfig[] = [
  {
    name: "Brixton",
    slug: "brixton",
    logo: "/Brixton Motorcycles logo.svg",
    width: 140,
    height: 36,
    logoClass: "h-5 w-auto max-w-[120px] sm:h-6",
    logoClassLg: "h-7 w-auto max-w-[150px] sm:h-8",
  },
  {
    name: "Mutt",
    slug: "mutt",
    logo: "/mutt.svg",
    width: 100,
    height: 36,
    logoClass: "h-4 w-auto max-w-[80px] sm:h-5",
    logoClassLg: "h-6 w-auto max-w-[100px] sm:h-7",
  },
  {
    name: "Motron",
    slug: "motron",
    logo: "/motron.svg",
    width: 120,
    height: 48,
    logoClass: "h-5 w-auto max-w-[110px] sm:h-6",
    logoClassLg: "h-7 w-auto max-w-[140px] sm:h-8",
  },
  {
    name: "Malaguti",
    slug: "malaguti",
    logo: "/malaguti.svg",
    width: 120,
    height: 22,
    logoClass: "h-4 w-auto max-w-[110px] sm:h-5",
    logoClassLg: "h-6 w-auto max-w-[140px] sm:h-7",
  },
  {
    name: "Pando Moto",
    slug: "pando-moto",
    logo: "/PandoMoto.svg",
    width: 110,
    height: 32,
    logoClass: "h-4 w-auto max-w-[90px] sm:h-5",
    logoClassLg: "h-5 w-auto max-w-[110px] sm:h-6",
  },
  {
    name: "Holyfreedom",
    slug: "holyfreedom",
    logo: "/HF-square-Wht.png",
    width: 72,
    height: 72,
    logoClass: "h-6 w-auto max-w-[56px] sm:h-7",
    logoClassLg: "h-7 w-auto max-w-[64px] sm:h-8",
  },
  {
    name: "Johnny Reb",
    slug: "johnny-reb",
    logo: "/johnny-reb.webp",
    width: 120,
    height: 36,
    logoClass: "h-4 w-auto max-w-[90px] sm:h-5",
    logoClassLg: "h-5 w-auto max-w-[110px] sm:h-6",
  },
  {
    name: "Bobhead",
    slug: "bobhead",
    logo: "/bobhead.avif",
    width: 110,
    height: 32,
    logoClass: "h-4 w-auto max-w-[90px] sm:h-5",
    logoClassLg: "h-5 w-auto max-w-[110px] sm:h-6",
  },
  {
    name: "Motogirl",
    slug: "motogirl",
    logo: "/motogirl.png",
    width: 110,
    height: 36,
    logoClass: "h-4 w-auto max-w-[90px] sm:h-5",
    logoClassLg: "h-5 w-auto max-w-[110px] sm:h-6",
  },
  {
    name: "Makita",
    slug: "makita",
    logoClass: "",
    logoClassLg: "",
  },
] as const;
