"use client";

import Link from "next/link";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

export default function ShopError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useLocale();
  const dict = useDictionary();

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow text-accent">{dict.shopError.eyebrow}</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        {dict.shopError.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        {dict.shopError.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => unstable_retry()} className="btn-accent">
          {dict.shopError.retry}
        </button>
        <Link href={localizedHref(locale, buildEquipmentHubHref(locale))} className="btn-ghost">
          {dict.shopError.equipmentHub}
        </Link>
        <Link href={localizedHref(locale, "/")} className="btn-ghost">
          {dict.shopError.home}
        </Link>
      </div>
    </div>
  );
}
