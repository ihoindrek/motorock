"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { shopNav, siteNav, type NavColumn } from "@/data/navigation";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  locale: "en" | "et";
  onLocaleChange: (locale: "en" | "et") => void;
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
      className="size-6"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className={`size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CollapsiblePanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function EquipmentColumnAccordion({
  column,
  open,
  onToggle,
  onNavigate,
}: {
  column: NavColumn;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const triggerId = useId();
  const panelId = useId();

  return (
    <section
      className="border-t border-ink/10"
      aria-labelledby={triggerId}
    >
      <div className="flex items-center">
        <Link
          href={column.viewAll.href}
          onClick={onNavigate}
          className="min-w-0 flex-1 py-3.5 font-display text-sm font-bold uppercase tracking-aggressive text-ink/80 transition-colors hover:text-accent"
        >
          {column.title}
        </Link>
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="inline-flex size-11 shrink-0 items-center justify-center text-ink/70 transition-colors hover:text-accent"
        >
          <span className="sr-only">
            {open ? "Close" : "Open"} {column.title}
          </span>
          <ChevronIcon open={open} />
        </button>
      </div>

      <CollapsiblePanel id={panelId} open={open}>
        <ul className="space-y-0.5 border-l border-ink/10 pb-4 pl-4">
          {column.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="block py-2.5 text-sm text-ink/75 transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={column.viewAll.href}
          onClick={onNavigate}
          className="mb-4 inline-block pl-4 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
        >
          {column.viewAll.label} →
        </Link>
      </CollapsiblePanel>
    </section>
  );
}

function EquipmentAccordion({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const item = shopNav.find((navItem) => navItem.megaMenu);
  const [open, setOpen] = useState(false);
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const triggerId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      setOpenColumn(null);
    }
  }, [open]);

  if (!item?.megaMenu) {
    return null;
  }

  return (
    <section className="border-b border-ink/10">
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className="min-w-0 flex-1 py-5 font-display text-base font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent"
        >
          {item.label}
        </Link>
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-12 shrink-0 items-center justify-center text-ink transition-colors hover:text-accent"
        >
          <span className="sr-only">
            {open ? "Close" : "Open"} {item.label} categories
          </span>
          <ChevronIcon open={open} />
        </button>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4">
            {item.megaMenu.columns.map((column) => (
              <EquipmentColumnAccordion
                key={column.title}
                column={column}
                open={openColumn === column.title}
                onToggle={() =>
                  setOpenColumn((current) =>
                    current === column.title ? null : column.title,
                  )
                }
                onNavigate={onNavigate}
              />
            ))}

            <div className="border-t border-ink/10 pt-4">
              <Link
                href={item.megaMenu.promo.href}
                onClick={onNavigate}
                className="inline-flex font-display text-xs font-bold uppercase tracking-aggressive text-accent transition-colors hover:text-accent-hover"
              >
                {item.megaMenu.promo.cta} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MobileNav({
  open,
  onClose,
  locale,
  onLocaleChange,
}: MobileNavProps) {
  const labelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <nav
        id="mobile-navigation"
        aria-labelledby={labelId}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5 sm:h-20">
          <p
            id={labelId}
            className="font-display text-xs font-bold uppercase tracking-aggressive text-ink"
          >
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:text-accent"
          >
            <span className="sr-only">Close menu</span>
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {shopNav.map((item) =>
            item.megaMenu ? (
              <EquipmentAccordion key={item.href} onNavigate={onClose} />
            ) : (
              <div key={item.href} className="border-b border-ink/10">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-5 font-display text-base font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </div>
            ),
          )}

          <div
            className="my-1 border-t border-ink/10"
            aria-hidden="true"
            role="presentation"
          />

          {siteNav.map((item) => (
            <div key={item.href} className="border-b border-ink/10">
              <Link
                href={item.href}
                onClick={onClose}
                className="block py-4 font-display text-sm font-bold uppercase tracking-aggressive text-ink/75 transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            </div>
          ))}

          <div className="border-b border-ink/10 py-4">
            <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              Language
            </p>
            <div className="mt-3 inline-grid grid-cols-2 rounded-sm border border-ink/15 p-0.5 font-display text-[11px] font-bold uppercase tracking-aggressive">
              {([
                { code: "en", label: "EN" },
                { code: "et", label: "ET" },
              ] as const).map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLocaleChange(code)}
                  aria-pressed={locale === code}
                  className={`min-w-[2.75rem] px-3 py-2 transition-colors ${
                    locale === code
                      ? "bg-ink text-paper"
                      : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-ink/10 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            Get in touch
          </p>
          <a
            href="tel:+37255551234"
            className="mt-3 flex min-h-12 w-full items-center justify-center border border-ink/20 px-4 py-3 font-display text-sm font-bold tabular-nums tracking-tight text-ink transition-colors hover:border-accent hover:text-accent"
          >
            +372 5555 1234
          </a>
        </div>
      </nav>
    </>
  );
}
