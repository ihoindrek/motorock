"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { reportClientError } from "@/lib/monitoring/observability-client";

export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useLocale();
  const dict = useDictionary();

  useEffect(() => {
    void reportClientError(error, { source: "locale-error" });
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
