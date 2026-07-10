"use client";

import { useEffect, useMemo } from "react";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { reportClientError } from "@/lib/monitoring/observability-client";

function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${localeCookieName}=([^;]*)`),
  );
  const value = match?.[1];

  return value && isLocale(value) ? value : defaultLocale;
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useMemo(() => readLocaleFromCookie(), []);
  const dict = getDictionary(locale);

  useEffect(() => {
    void reportClientError(error, { source: "global-error" });
  }, [error]);

  return (
    <html lang={locale}>
      <body className="bg-paper font-body text-ink antialiased">
        <div
          style={{
            maxWidth: "40rem",
            margin: "0 auto",
            padding: "4rem 1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#FF6813",
            }}
          >
            Motorock.eu
          </p>
          <h1 style={{ marginTop: "1rem", fontSize: "2rem", fontWeight: 800 }}>
            {dict.error.title}
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6, color: "rgb(11 11 11 / 0.65)" }}>
            {dict.error.globalDescription}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              border: "none",
              background: "#FF6813",
              color: "#FAF8F6",
              padding: "0.75rem 1.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {dict.error.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
