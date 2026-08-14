"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckoutMobileSectionProps = {
  id: string;
  step: 1 | 2 | 3;
  title: string;
  complete?: boolean;
  locked?: boolean;
  lockedMessage?: string;
  summary?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsible?: boolean;
  /** Mobiilil peidetud header — sisu on alati nähtav (nt ostukorv). */
  mobileHeaderless?: boolean;
  children: ReactNode;
};

export function CheckoutMobileSection({
  id,
  step,
  title,
  complete = false,
  locked = false,
  lockedMessage,
  summary,
  open = true,
  onOpenChange,
  collapsible = true,
  mobileHeaderless = false,
  children,
}: CheckoutMobileSectionProps) {
  const canToggle = collapsible && !locked && Boolean(onOpenChange);
  const isCollapsed = !open;
  const showMobileHeader = !mobileHeaderless;

  return (
    <section
      id={id}
      className="scroll-mt-28 lg:scroll-mt-24 lg:border-t lg:border-ink/10 lg:py-10 lg:first:border-t-0 lg:first:pt-0"
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-white shadow-[0_4px_20px_rgb(11_11_11_/_0.06)]",
          "lg:rounded-none lg:bg-transparent lg:shadow-none",
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (canToggle) {
              onOpenChange?.(!open);
            }
          }}
          disabled={!canToggle}
          aria-expanded={mobileHeaderless ? true : open}
          aria-controls={`${id}-panel`}
          className={cn(
            "flex w-full items-start gap-3 px-4 py-4 text-left lg:pointer-events-none lg:cursor-default lg:px-0 lg:pb-2 lg:pt-0",
            showMobileHeader ? "flex" : "hidden lg:flex",
            canToggle ? "cursor-pointer" : "cursor-default",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums",
              complete
                ? "border-accent bg-accent text-paper"
                : locked
                  ? "border-ink/15 text-ink/30"
                  : "border-accent text-accent",
            )}
            aria-hidden="true"
          >
            {complete ? "✓" : step}
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-body text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl">
              {title}
            </span>
            {isCollapsed && summary ? (
              <span className="mt-1 block text-sm leading-snug text-ink/55 lg:hidden">
                {summary}
              </span>
            ) : null}
            {isCollapsed && locked && lockedMessage ? (
              <span className="mt-1 block text-sm leading-snug text-ink/55 lg:hidden">
                {lockedMessage}
              </span>
            ) : null}
          </span>
          {canToggle ? (
            <ChevronDown
              className={cn(
                "mt-1 size-5 shrink-0 text-ink/35 transition-transform duration-200 lg:hidden",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          ) : null}
        </button>

        <div
          id={`${id}-panel`}
          className={cn(
            mobileHeaderless || open ? "block" : "hidden lg:block",
            mobileHeaderless
              ? "px-4 pb-4 pt-5 lg:px-0 lg:pb-0 lg:pt-8"
              : "px-4 pb-4 pt-5 lg:px-0 lg:pb-0 lg:pt-8",
            locked && open && "pointer-events-none opacity-45",
          )}
        >
          {locked && open && lockedMessage ? (
            <p className="mb-4 text-sm text-ink/55 lg:hidden">{lockedMessage}</p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
