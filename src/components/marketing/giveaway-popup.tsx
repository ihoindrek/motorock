"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * One-time campaign popup (EN only). Bump the key suffix to re-show the
 * popup for a future campaign.
 */
const STORAGE_KEY = "motorock_popup_seen:crossfire-500-storr-2026";
const SHOW_DELAY_MS = 2500;
/** Prize draw day (26 Sep 2026, Estonian time) — no point promoting after. */
const CAMPAIGN_ENDS = Date.parse("2026-09-26T23:59:59+03:00");
const CAMPAIGN_HREF = "/en/blog/win-a-brixton-crossfire-500-storr-motorock-giveaway-2026";

/** Don't interrupt buying or reading the campaign itself. */
const SUPPRESSED_PATHS = ["/en/cart", "/en/checkout", CAMPAIGN_HREF];

export function GiveawayPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Date.now() > CAMPAIGN_ENDS) {
      return;
    }

    if (SUPPRESSED_PATHS.some((path) => pathname.startsWith(path))) {
      return;
    }

    try {
      if (window.localStorage.getItem(STORAGE_KEY)) {
        return;
      }
    } catch {
      // Storage unavailable (private mode etc) — skip rather than nag on
      // every visit.
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore: worst case the popup shows again next visit.
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss is stable in practice
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="MotoRock giveaway 2026"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-sm animate-[popup-fade_.25s_ease-out] sm:max-w-md">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 flex size-10 items-center justify-center border border-paper/30 bg-ink text-paper transition-colors hover:bg-accent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="square"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <Link href={CAMPAIGN_HREF} onClick={dismiss} className="block">
          <Image
            src="/giveaway.webp"
            alt="WIN a Brixton Crossfire 500 STORR — MotoRock Giveaway 2026. Every 100 euros spent enters you into the draw."
            width={1000}
            height={1241}
            sizes="(max-width: 640px) 90vw, 448px"
            priority
            className="h-auto w-full"
          />
          <span className="flex min-h-12 items-center justify-center bg-accent px-6 py-3 text-center font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-ink">
            Read more &amp; enter the draw →
          </span>
        </Link>
      </div>
    </div>,
    document.body,
  );
}
