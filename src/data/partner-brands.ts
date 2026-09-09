import { brands } from "@/data/brands";
import { equipmentHubBrands } from "@/data/equipment-hub";
import { isMotorcycleBrandSlug } from "@/lib/shop/resolve-product-brand";
import { cn } from "@/lib/utils";

export type PartnerBrandLogo = {
  slug: string;
  name: string;
  logo: string;
  width: number;
  height: number;
  logoClassName: string;
};

/** Dark-band homepage strip — white logos, larger than footer. */
export const partnerBrandLogos: readonly PartnerBrandLogo[] = [
  ...brands
    .filter(
      (brand): brand is typeof brand & { logo: string } =>
        Boolean(brand.logo) && isMotorcycleBrandSlug(brand.slug),
    )
    .map((brand) => ({
      slug: brand.slug,
      name: brand.name,
      logo: brand.logo,
      width: brand.width ?? 140,
      height: brand.height ?? 36,
      logoClassName: cn(
        brand.logoClassLg,
        "h-10 w-auto max-w-[9.5rem] sm:h-11 lg:h-12 xl:max-w-[11rem]",
        "brightness-0 invert",
      ),
    })),
  ...equipmentHubBrands.map((brand) => ({
    slug: brand.slug,
    name: brand.name,
    logo: brand.logo,
    width: 120,
    height: 36,
    logoClassName: cn(
      "h-9 w-auto max-w-[8.5rem] sm:h-10 lg:h-11 xl:max-w-[10rem]",
      brand.logoInvert !== false && "brightness-0 invert",
    ),
  })),
];
