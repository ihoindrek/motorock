import { brands, type BrandConfig } from "@/data/brands";

export function getBrandByName(name: string): BrandConfig | undefined {
  const normalized = name.trim().toLowerCase();

  return brands.find((brand) => brand.name.toLowerCase() === normalized);
}

export function getBrandBySlug(slug: string): BrandConfig | undefined {
  const normalized = slug.trim().toLowerCase();

  return brands.find((brand) => brand.slug === normalized);
}

export function getCanonicalBrandName(name: string): string {
  return getBrandByName(name)?.name ?? name;
}
