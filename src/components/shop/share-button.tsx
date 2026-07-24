"use client";

import { useState } from "react";
import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

function ShareIcon() {
  return (
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
      <path d="M12 3v13" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 12v8h14v-8" />
    </svg>
  );
}

type ShareButtonProps = {
  /** Share sheet title, e.g. the product name. */
  title: string;
  className?: string;
};

/**
 * Native share sheet where available (mobile), copy-link fallback elsewhere.
 * The shared URL is tagged with utm_source=share for analytics.
 */
export function ShareButton({ title, className }: ShareButtonProps) {
  const dict = useDictionary();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("utm_source", "share");
    const shareUrl = url.toString();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (cause) {
        // User closed the share sheet — do nothing.
        if (cause instanceof Error && cause.name === "AbortError") {
          return;
        }
        // Otherwise fall through to the copy-link fallback.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / permissions) — no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive transition-colors",
        copied ? "text-accent" : "text-ink/45 hover:text-accent",
        className,
      )}
    >
      <ShareIcon />
      {copied ? dict.pdp.linkCopied : dict.pdp.share}
    </button>
  );
}
