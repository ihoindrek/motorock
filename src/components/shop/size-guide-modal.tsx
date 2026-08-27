"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { SizeGuide, SizeGuideFit } from "@/types/size-guide";
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

const FIT_LABELS: Record<SizeGuideFit, { en: string; et: string }> = {
  slim: { en: "Slim fit", et: "Slim fit" },
  regular: { en: "Regular fit", et: "Regular fit" },
  relaxed: { en: "Relaxed fit", et: "Lõdvem fit" },
};

function normalizeSizeLabel(size: string) {
  return size.trim().toUpperCase();
}

function resolveInitialSize(
  guide: SizeGuide,
  selectedSize?: string,
): string {
  const sizes = guide.rows.map((row) => row.size);
  if (selectedSize) {
    const normalized = normalizeSizeLabel(selectedSize);
    const match = sizes.find(
      (size) => normalizeSizeLabel(size) === normalized,
    );
    if (match) {
      return match;
    }
  }

  return sizes[0] ?? "";
}

export function SizeGuideModal({
  open,
  onClose,
  guide,
  selectedSize,
}: SizeGuideModalProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [activeSize, setActiveSize] = useState(() =>
    resolveInitialSize(guide, selectedSize),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveSize(resolveInitialSize(guide, selectedSize));
    }
  }, [open, guide, selectedSize]);

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

  const activeRow = useMemo(
    () =>
      guide.rows.find(
        (row) => normalizeSizeLabel(row.size) === normalizeSizeLabel(activeSize),
      ) ?? guide.rows[0],
    [activeSize, guide.rows],
  );

  if (!mounted || !activeRow) {
    return null;
  }

  const fitLabel = guide.fit
    ? FIT_LABELS[guide.fit][locale === "et" ? "et" : "en"]
    : null;
  const hasCustomContent = Boolean(guide.contentHtml?.trim());

  return createPortal(
    <>
      <button
        type="button"
        aria-label={dict.pdp.sizeGuideClose}
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
          "fixed inset-x-4 top-[6vh] z-[121] mx-auto flex max-h-[88vh] max-w-xl flex-col overflow-hidden border border-ink/10 bg-white shadow-[0_24px_80px_rgb(11_11_11_/_0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
              {dict.pdp.sizeGuide}
            </p>
            <h2
              id="size-guide-title"
              className="mt-2 text-xl font-extrabold uppercase leading-tight tracking-tight text-ink"
            >
              {guide.title}
            </h2>
            {fitLabel ? (
              <p className="mt-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                {fitLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center text-ink/50 transition-colors hover:text-accent"
          >
            <span className="sr-only">{dict.pdp.sizeGuideClose}</span>
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-auto px-5 py-5 sm:px-6">
          {guide.imageUrl ? (
            <div className="relative mb-5 aspect-[4/3] w-full">
              <Image
                src={guide.imageUrl}
                alt={guide.title}
                fill
                sizes="(max-width: 640px) 90vw, 36rem"
                className="object-contain"
              />
            </div>
          ) : null}

          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {dict.pdp.sizeGuideUnit}
          </p>

          <div
            className="mt-3 flex flex-wrap gap-2"
            role="tablist"
            aria-label={dict.pdp.size}
          >
            {guide.rows.map((row) => {
              const isActive =
                normalizeSizeLabel(row.size) === normalizeSizeLabel(activeSize);

              return (
                <button
                  key={row.size}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveSize(row.size)}
                  className={cn(
                    "min-h-11 min-w-[2.75rem] border px-3 py-2 font-body text-xs font-bold uppercase tracking-aggressive transition-colors",
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-ink hover:border-ink",
                  )}
                >
                  {row.size}
                </button>
              );
            })}
          </div>

          <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5">
            {guide.columns.map((column) => (
              <div
                key={column.key}
                className="flex items-baseline justify-between gap-4"
              >
                <dt className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                  {column.label}
                </dt>
                <dd className="tabular-nums text-sm font-medium text-ink">
                  {activeRow.measurements[column.key] ?? "—"}{" "}
                  <span className="text-xs font-normal text-ink/40">cm</span>
                </dd>
              </div>
            ))}
          </dl>

          {guide.note ? (
            <p className="mt-5 text-sm leading-relaxed text-ink/60">
              {guide.note}
            </p>
          ) : null}

          {hasCustomContent ? (
            <div
              className="size-guide-content mt-6 max-w-none border-t border-ink/10 pt-5 text-sm leading-relaxed text-ink/75 [&_li]:ml-5 [&_li]:list-item [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p+p]:mt-3 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: guide.contentHtml ?? "" }}
            />
          ) : (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                {dict.pdp.sizeGuideHowToMeasure}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/60">
                {guide.columns.some((column) => column.key === "chest") ? (
                  <li>{dict.pdp.sizeGuideMeasureChest}</li>
                ) : null}
                {guide.columns.some((column) => column.key === "waist") ? (
                  <li>{dict.pdp.sizeGuideMeasureWaist}</li>
                ) : null}
                {guide.columns.some((column) => column.key === "hips") ? (
                  <li>{dict.pdp.sizeGuideMeasureHips}</li>
                ) : null}
                {guide.columns.some((column) => column.key === "inseam") ? (
                  <li>{dict.pdp.sizeGuideMeasureInseam}</li>
                ) : null}
                {guide.columns.some(
                  (column) =>
                    column.key === "length" || column.key === "sleeve",
                ) ? (
                  <li>{dict.pdp.sizeGuideMeasureGarment}</li>
                ) : null}
              </ul>
            </div>
          )}

          <details className="group mt-6 border-t border-ink/10 pt-5">
            <summary className="cursor-pointer list-none font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                {dict.pdp.sizeGuideAllSizes}
                <span
                  className="text-base font-normal leading-none transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </span>
            </summary>
            <table className="mt-4 w-full min-w-[16rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10">
                  <th
                    scope="col"
                    className="pb-3 pr-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45"
                  >
                    {dict.pdp.size}
                  </th>
                  {guide.columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="pb-3 pr-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 last:pr-0"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map((row) => {
                  const isActive =
                    normalizeSizeLabel(row.size) ===
                    normalizeSizeLabel(activeSize);

                  return (
                    <tr
                      key={row.size}
                      className={cn(
                        "border-b border-ink/8 last:border-b-0",
                        isActive && "bg-accent/[0.06]",
                      )}
                    >
                      <th
                        scope="row"
                        className={cn(
                          "py-3 pr-4 font-body text-xs font-bold uppercase tracking-aggressive",
                          isActive ? "text-accent" : "text-ink",
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
          </details>
        </div>
      </div>
    </>,
    document.body,
  );
}
