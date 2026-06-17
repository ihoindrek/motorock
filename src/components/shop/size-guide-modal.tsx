"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SizeGuide } from "@/types/size-guide";
import { cn } from "@/lib/utils";

type SizeGuideModalProps = {
  open: boolean;
  onClose: () => void;
  guide: SizeGuide;
  selectedSize?: string;
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

export function SizeGuideModal({
  open,
  onClose,
  guide,
  selectedSize,
}: SizeGuideModalProps) {
  const [mounted, setMounted] = useState(false);

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

  const normalizedSelected = selectedSize?.trim().toUpperCase();

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close size guide"
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
        aria-labelledby="size-guide-title"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-4 top-[8vh] z-[121] mx-auto flex max-h-[84vh] max-w-lg flex-col overflow-hidden border border-ink/10 bg-paper shadow-[0_24px_80px_rgb(11_11_11_/_0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
              Size guide
            </p>
            <h2
              id="size-guide-title"
              className="mt-2 text-lg font-extrabold uppercase leading-tight tracking-tight text-ink"
            >
              {guide.title}
            </h2>
            {guide.note ? (
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {guide.note}
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

        <div className="overflow-auto px-5 py-5 sm:px-6">
          <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th
                  scope="col"
                  className="pb-3 pr-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45"
                >
                  Size
                </th>
                {guide.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="pb-3 pr-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 last:pr-0"
                  >
                    {column.label}
                    <span className="ml-1 font-normal normal-case text-ink/35">
                      (cm)
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row) => {
                const isSelected =
                  normalizedSelected === row.size.trim().toUpperCase();

                return (
                  <tr
                    key={row.size}
                    className={cn(
                      "border-b border-ink/8 last:border-b-0",
                      isSelected && "bg-accent/[0.06]",
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(
                        "py-3 pr-4 font-body text-xs font-bold uppercase tracking-aggressive",
                        isSelected ? "text-accent" : "text-ink",
                      )}
                    >
                      {row.size}
                    </th>
                    {guide.columns.map((column) => (
                      <td
                        key={column.key}
                        className="py-3 pr-4 tabular-nums text-ink/75 last:pr-0"
                      >
                        {row.measurements[column.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>,
    document.body,
  );
}
