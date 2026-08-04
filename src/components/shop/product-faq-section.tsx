"use client";

import { useState, type ReactNode } from "react";

export type ProductFaqEntry = {
  question: string;
  answer: string;
};

type ProductFaqSectionProps = {
  title: string;
  items: readonly ProductFaqEntry[];
  bordered?: boolean;
};

function CollapsiblePanel({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function FaqAccordion({
  open,
  title,
  children,
  onOpenChange,
  bordered = true,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-t border-ink/10" : undefined}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          onOpenChange?.(!open);
        }}
        className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-body text-[11px] font-bold uppercase tracking-aggressive text-ink"
      >
        {title}
        <span
          className={`text-lg font-normal leading-none text-ink/40 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <CollapsiblePanel open={open}>
        <div className="pb-5">{children}</div>
      </CollapsiblePanel>
    </div>
  );
}

export function ProductFaqSection({
  title,
  items,
  bordered = true,
}: ProductFaqSectionProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  return (
    <FaqAccordion
      open={open}
      title={title}
      onOpenChange={setOpen}
      bordered={bordered}
    >
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.question} className="border-b border-ink/10 pb-4 last:border-b-0 last:pb-0">
            <h3 className="text-sm font-semibold text-ink">{item.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{item.answer}</p>
          </div>
        ))}
      </div>
    </FaqAccordion>
  );
}
