"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

/**
 * Client component on purpose: reading cookies()/headers() here would make
 * the global not-found boundary dynamic, which in turn disables static
 * prerendering (ISR) for every route in the app.
 */
export default function NotFound() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">404</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        {dict.notFound.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        {dict.notFound.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={localizedHref(locale, buildEquipmentHubHref(locale))}
          className="btn-accent"
        >
          {dict.notFound.shopEquipment}
        </Link>
        <Link href={localizedHref(locale, "/search")} className="btn-ghost">
          {dict.notFound.search}
        </Link>
      </div>
    </div>
  );
}
