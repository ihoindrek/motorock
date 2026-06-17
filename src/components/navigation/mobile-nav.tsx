"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { brands } from "@/data/brands";
import type { NavColumn } from "@/data/navigation";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { Locale } from "@/i18n/config";
import { getShopNav, getSiteNav } from "@/i18n/navigation";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";
import { localizedHref } from "@/i18n/paths";

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
          className="min-w-0 flex-1 py-3.5 font-body text-sm font-bold uppercase tracking-aggressive text-ink/80 transition-colors hover:text-accent"
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
          className="mb-4 inline-block pl-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
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
  const locale = useLocale();
  const dictionary = useDictionary();
  const shopNav = getShopNav(locale, dictionary);
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
          className="min-w-0 flex-1 py-5 font-body text-base font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent"
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
                className="inline-flex font-body text-xs font-bold uppercase tracking-aggressive text-accent transition-colors hover:text-accent-hover"
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

function MotorcycleBrandsAccordion({
  onNavigate,
  title,
}: {
  onNavigate: () => void;
  title: string;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const panelId = useId();
  const motorcycleBrands = brands.filter((brand) => brand.logo);

  return (
    <section className="border-b border-ink/10">
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 font-body text-sm font-bold uppercase tracking-aggressive text-ink/75 transition-colors hover:text-accent"
      >
        {title}
        <ChevronIcon open={open} />
      </button>

      <CollapsiblePanel id={panelId} open={open}>
        <ul className="space-y-0.5 border-l border-ink/10 pb-4 pl-4">
          {motorcycleBrands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={localizedHref(locale, getBrandCatalogHref(brand.slug))}
                onClick={onNavigate}
                className="block py-2.5 text-sm text-ink/75 transition-colors hover:text-accent"
              >
                {brand.name}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsiblePanel>
    </section>
  );
}

export function MobileNav({
  open,
  onClose,
  locale,
  onLocaleChange,
}: MobileNavProps) {
  const dictionary = useDictionary();
  const shopNav = getShopNav(locale, dictionary);
  const siteNav = getSiteNav(locale, dictionary);
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
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5 sm:h-20">
          <p
            id={labelId}
            className="font-body text-xs font-bold uppercase tracking-aggressive text-ink"
          >
            {dictionary.nav.menu}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:text-accent"
          >
            <span className="sr-only">{dictionary.nav.closeMenu}</span>
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
                  className="block py-5 font-body text-base font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </div>
            ),
          )}

          <MotorcycleBrandsAccordion
            onNavigate={onClose}
            title={dictionary.nav.motorcycleBrands}
          />

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
                className="block py-4 font-body text-sm font-bold uppercase tracking-aggressive text-ink/75 transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            </div>
          ))}

          <div className="border-b border-ink/10 py-4">
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              {dictionary.nav.language}
            </p>
            <div className="mt-3 inline-grid grid-cols-2 rounded-sm border border-ink/15 p-0.5 font-body text-[11px] font-bold uppercase tracking-aggressive">
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
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {dictionary.nav.getInTouch}
          </p>
          <a
            href="tel:+37255551234"
            className="mt-3 flex min-h-12 w-full items-center justify-center border border-ink/20 px-4 py-3 font-body text-sm font-bold tabular-nums tracking-tight text-ink transition-colors hover:border-accent hover:text-accent"
          >
            +372 5555 1234
          </a>
        </div>
      </nav>
    </>
  );
}
