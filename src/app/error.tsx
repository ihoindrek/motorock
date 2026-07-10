"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";

function localeFromPathname(pathname: string | null): Locale {
  const segment = pathname?.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : "en";
}

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const dict = getDictionary(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">{dict.error.eyebrow}</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        {dict.error.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        {dict.error.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => unstable_retry()} className="btn-accent">
          {dict.error.retry}
        </button>
        <Link href={localizedHref(locale, "/")} className="btn-ghost">
          {dict.error.backToHome}
        </Link>
      </div>
    </div>
  );
}
