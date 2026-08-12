"use client";

import Link from "next/link";
import type { Breadcrumb } from "@/lib/shop/category";
import { useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";

type ProductBreadcrumbsProps = {
  crumbs: readonly Breadcrumb[];
  /** Current page label (product name) — rendered as plain text. */
  currentLabel?: string;
  className?: string;
};

export function ProductBreadcrumbs({
  crumbs,
  currentLabel,
  className = "",
}: ProductBreadcrumbsProps) {
  const locale = useLocale();

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            <Link
              href={localizedHref(locale, crumb.href)}
              className="transition-colors hover:text-accent"
            >
              {crumb.label}
            </Link>
          </li>
        ))}
        {currentLabel ? (
          <li className="flex items-center gap-2">
            {crumbs.length > 0 ? <span aria-hidden="true">/</span> : null}
            <span className="text-ink">{currentLabel}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
