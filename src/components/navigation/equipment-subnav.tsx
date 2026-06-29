"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref, stripLocaleFromPath } from "@/i18n/paths";
import { buildEquipmentCategoryHref } from "@/lib/shop/equipment-route";
import { cn } from "@/lib/utils";

type EquipmentSectionId = "for-men" | "for-women" | "accessories";

function resolveActiveSection(pathname: string): EquipmentSectionId | null {
  const basePath = stripLocaleFromPath(pathname);

  if (!basePath.startsWith("/shop/equipment")) {
    return null;
  }

  if (basePath === "/shop/equipment") {
    return null;
  }

  if (basePath.startsWith(buildEquipmentCategoryHref("for-men"))) {
    return "for-men";
  }

  if (basePath.startsWith(buildEquipmentCategoryHref("for-women"))) {
    return "for-women";
  }

  return "accessories";
}

export function EquipmentSubnav() {
  const pathname = usePathname();
  const locale = useLocale();
  const dict = useDictionary();
  const activeSection = resolveActiveSection(pathname);

  const equipmentSections = [
    {
      id: "for-men" as const,
      label: dict.nav.forMen,
      href: localizedHref(locale, buildEquipmentCategoryHref("for-men")),
    },
    {
      id: "for-women" as const,
      label: dict.nav.forWomen,
      href: localizedHref(locale, buildEquipmentCategoryHref("for-women")),
    },
    {
      id: "accessories" as const,
      label: dict.nav.accessories,
      href: localizedHref(locale, buildEquipmentCategoryHref("accessories")),
    },
  ];

  if (stripLocaleFromPath(pathname) === "/shop/equipment") {
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
