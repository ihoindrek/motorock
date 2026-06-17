"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const equipmentSections = [
  {
    id: "men" as const,
    label: "For men",
    href: "/shop/equipment/men",
  },
  {
    id: "women" as const,
    label: "For women",
    href: "/shop/equipment/women",
  },
  {
    id: "accessories" as const,
    label: "Accessories",
    href: "/shop/equipment/accessories",
  },
] as const;

type EquipmentSectionId = (typeof equipmentSections)[number]["id"];

function resolveActiveSection(pathname: string): EquipmentSectionId | null {
  if (!pathname.startsWith("/shop/equipment")) {
    return null;
  }

  if (pathname === "/shop/equipment") {
    return null;
  }

  if (pathname.startsWith("/shop/equipment/men")) {
    return "men";
  }

  if (pathname.startsWith("/shop/equipment/women")) {
    return "women";
  }

  return "accessories";
}

export function EquipmentSubnav() {
  const pathname = usePathname();
  const activeSection = resolveActiveSection(pathname);

  if (pathname === "/shop/equipment") {
    return null;
  }

  return (
    <nav
      aria-label="Driving equipment"
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
                    "inline-flex min-h-10 items-center whitespace-nowrap px-4 py-2 font-display text-xs font-bold uppercase tracking-aggressive transition-colors sm:px-5",
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
