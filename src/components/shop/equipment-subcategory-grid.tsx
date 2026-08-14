import Image from "next/image";
import Link from "next/link";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import type { EquipmentSubcategory } from "@/lib/shop/equipment-subcategories";

type EquipmentSubcategoryGridProps = {
  locale: Locale;
  subcategories: readonly EquipmentSubcategory[];
};

export function EquipmentSubcategoryGrid({
  locale,
  subcategories,
}: EquipmentSubcategoryGridProps) {
  const copy =
    locale === "et"
      ? {
          explore: "Avasta",
          products: "toodet",
        }
      : {
          explore: "Explore",
          products: "products",
        };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {subcategories.map((subcategory) => (
        <Link
          key={subcategory.wcSlug}
          href={localizedHref(locale, subcategory.href)}
          className="group relative flex min-h-[18rem] items-end overflow-hidden bg-ink sm:min-h-[20rem]"
        >
          <Image
            src={subcategory.image}
            alt={subcategory.imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <GrainOverlay variant="dark" subtle />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/10"
            aria-hidden="true"
          />

          <div className="relative z-10 w-full p-5 sm:p-6">
            <h2 className="font-body text-2xl font-bold normal-case leading-[0.95] tracking-normal text-paper sm:text-3xl">
              {subcategory.title}
            </h2>
            {subcategory.productCount > 0 ? (
              <p className="mt-2 text-sm text-paper/65">
                {subcategory.productCount} {copy.products}
              </p>
            ) : null}
            <span className="btn-hero-ghost mt-4 inline-flex px-5 py-3 sm:px-6">
              {copy.explore}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
