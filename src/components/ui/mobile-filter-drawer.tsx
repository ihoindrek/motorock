"use client";

import { useId, useRef, useEffect, type ReactNode } from "react";
import { useDictionary } from "@/context/locale-context";
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
  const dict = useDictionary();
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
        className="fixed inset-0 z-[100] bg-ink/55 lg:hidden"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="fixed inset-0 z-[110] flex flex-col bg-paper lg:hidden"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <p
            id={labelId}
            className="font-body text-sm font-bold uppercase tracking-aggressive text-ink"
          >
            {title}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center text-ink/65 transition-colors hover:text-accent"
            aria-label={dict.common.close}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2">{children}</div>
        <div className="border-t border-ink/10 bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="btn-accent w-full justify-center"
          >
            {dict.checkout.apply}
          </button>
        </div>
      </aside>
    </>
  );
}
