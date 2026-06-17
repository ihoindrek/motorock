"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ShopModalProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
};

function CloseIcon() {
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
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ShopModal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  size = "md",
}: ShopModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close dialog"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-[120] bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-4 top-[max(1.25rem,env(safe-area-inset-top))] z-[121] mx-auto flex max-h-[min(88dvh,calc(100dvh-2rem))] flex-col overflow-hidden border border-ink/10 bg-paper shadow-[0_24px_80px_rgb(11_11_11_/_0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-auto sm:top-[6vh] sm:max-h-[88dvh] sm:left-1/2 sm:w-full sm:-translate-x-1/2",
          size === "lg" ? "max-w-2xl" : "max-w-lg",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink/10 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className={cn(
                "font-display font-extrabold uppercase leading-tight tracking-tight text-ink",
                eyebrow ? "mt-2 text-lg" : "text-lg",
              )}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center text-ink/50 transition-colors hover:text-accent"
          >
            <span className="sr-only">Close</span>
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
