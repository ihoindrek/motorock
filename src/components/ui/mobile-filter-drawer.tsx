"use client";

import { useId, useRef, useEffect, type ReactNode } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type MobileFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
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

export function MobileFilterDrawer({
  open,
  onClose,
  title = "Filters",
  children,
}: MobileFilterDrawerProps) {
  const labelId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(panelRef, open, { onEscape: onClose, initialFocus: closeRef });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/55 lg:hidden"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="fixed inset-y-0 left-0 z-[60] flex w-full max-w-sm flex-col bg-paper lg:hidden"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <p
            id={labelId}
            className="font-body text-sm font-bold uppercase tracking-aggressive text-ink"
          >
            {title}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center px-2 font-body text-xs font-bold uppercase tracking-aggressive text-accent"
            >
              Apply
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex size-10 items-center justify-center text-ink/65 transition-colors hover:text-accent"
              aria-label="Close filters"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2">{children}</div>
        <div className="border-t border-ink/10 bg-paper px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="btn-accent w-full justify-center"
          >
            Apply filters
          </button>
        </div>
      </aside>
    </>
  );
}
