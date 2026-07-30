"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import {
  getCustomerServiceNavItems,
  type CustomerServiceNavId,
} from "@/lib/legal/customer-service-nav";
import { cn } from "@/lib/utils";

type CustomerServiceSidebarProps = {
  locale: Locale;
  currentId: CustomerServiceNavId;
  title: string;
  className?: string;
};

function isNavItemActive(
  itemId: CustomerServiceNavId,
  currentId: CustomerServiceNavId,
  hash: string,
) {
  if (itemId === "return-product") {
    return currentId === "returns" && hash === "#withdrawal-form";
  }

  if (itemId === "returns") {
    return currentId === "returns" && hash !== "#withdrawal-form";
  }

  return itemId === currentId;
}

export function CustomerServiceSidebar({
  locale,
  currentId,
  title,
  className = "",
}: CustomerServiceSidebarProps) {
  const items = getCustomerServiceNavItems(locale);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <nav
      aria-label={title}
      className={cn("lg:sticky lg:top-28 lg:self-start", className)}
    >
      <h2 className="font-body text-base font-semibold text-ink">{title}</h2>
      <ul className="mt-5 space-y-3 border-b border-ink/10 pb-8 lg:border-b-0 lg:pb-0">
        {items.map((item) => {
          const active = isNavItemActive(item.id, currentId, hash);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "font-body text-sm text-ink/80 transition-colors hover:text-ink",
                  active && "font-medium text-ink underline underline-offset-4",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
