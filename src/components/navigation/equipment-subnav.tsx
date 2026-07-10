"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategoryTree } from "@/context/category-tree-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref, stripLocaleFromPath } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";
import { getLocalizedCategorySlug } from "@/lib/graphql/categories";
import {
  buildEquipmentCategoryHref,
  buildEquipmentHubHref,
  isEquipmentCategoryPath,
} from "@/lib/shop/category-url";
import { buildEquipmentRootCategoryHref } from "@/lib/shop/equipment-route";
import { cn } from "@/lib/utils";

type EquipmentSectionId = "for-men" | "for-women" | "accessories";

function matchesEquipmentSection(
  locale: Locale,
  basePath: string,
  wcSlug: string,
  localizedSlug: string,
) {
  return (
    basePath.startsWith(buildEquipmentCategoryHref(locale, localizedSlug)) ||
    basePath.startsWith(buildEquipmentCategoryHref(locale, wcSlug))
  );
}

function resolveActiveSection(
  pathname: string,
  locale: Locale,
  sections: Record<EquipmentSectionId, { wcSlug: string; localizedSlug: string }>,
): EquipmentSectionId | null {
  const basePath = stripLocaleFromPath(pathname);

  if (!isEquipmentCategoryPath(pathname)) {
    return null;
  }

  if (basePath === buildEquipmentHubHref(locale)) {
    return null;
  }

  if (matchesEquipmentSection(locale, basePath, sections["for-men"].wcSlug, sections["for-men"].localizedSlug)) {
    return "for-men";
  }

  if (
    matchesEquipmentSection(
      locale,
      basePath,
      sections["for-women"].wcSlug,
      sections["for-women"].localizedSlug,
    )
  ) {
    return "for-women";
  }

  return "accessories";
}

export function EquipmentSubnav() {
  const pathname = usePathname();
  const locale = useLocale();
  const dict = useDictionary();
  const tree = useCategoryTree();

  const sections = {
    "for-men": {
      wcSlug: "for-men",
      localizedSlug: getLocalizedCategorySlug(tree?.forMen ?? { slug: "for-men" }, locale),
    },
    "for-women": {
      wcSlug: "for-women",
      localizedSlug: getLocalizedCategorySlug(tree?.forWomen ?? { slug: "for-women" }, locale),
    },
    accessories: {
      wcSlug: "accessories",
      localizedSlug: getLocalizedCategorySlug(
        tree?.accessories ?? { slug: "accessories" },
        locale,
      ),
    },
  } as const;

  const activeSection = resolveActiveSection(pathname, locale, sections);

  const equipmentSections = [
    {
      id: "for-men" as const,
      label: dict.nav.forMen,
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.forMen, "for-men", locale),
      ),
    },
    {
      id: "for-women" as const,
      label: dict.nav.forWomen,
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.forWomen, "for-women", locale),
      ),
    },
    {
      id: "accessories" as const,
      label: dict.nav.accessories,
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.accessories, "accessories", locale),
      ),
    },
  ];

  if (stripLocaleFromPath(pathname) === buildEquipmentHubHref(locale)) {
    return null;
  }

  return (
    <nav
      aria-label={dict.nav.equipment}
      className="sticky top-16 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm sm:top-20 lg:hidden"
    >
      <div className="site-container">
        <ul className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:py-2.5 [&::-webkit-scrollbar]:hidden">
          {equipmentSections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <li key={section.id} className="shrink-0">
                <Link
                  href={section.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center whitespace-nowrap px-4 py-2 font-body text-xs font-bold uppercase tracking-aggressive transition-colors sm:px-5",
                    isActive
                      ? "bg-ink text-paper"
                      : "text-ink/60 hover:bg-surface hover:text-ink",
                  )}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
