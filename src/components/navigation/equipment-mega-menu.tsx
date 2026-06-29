"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavColumn, MegaMenu } from "@/data/navigation";

type EquipmentMegaMenuProps = {
  megaMenu: MegaMenu;
  ariaLabel: string;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate?: () => void;
};

export function EquipmentMegaMenu({
  megaMenu,
  ariaLabel,
  open,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
}: EquipmentMegaMenuProps) {
  const { columns, promo } = megaMenu;
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    if (open) {
      setContentKey((key) => key + 1);
    }
  }, [open]);

  return (
    <div
      id="mega-menu-equipment"
      role="region"
      aria-label={ariaLabel}
      aria-hidden={!open}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`mega-menu-shell absolute inset-x-0 top-full z-50 -mt-3 pt-3 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`overflow-hidden border-t border-ink/10 bg-white shadow-[0_20px_40px_rgb(11_11_11_/_0.08)] transition-shadow duration-300 ${
          open ? "shadow-[0_24px_48px_rgb(11_11_11_/_0.12)]" : ""
        }`}
      >
        <div
          className={`h-0.5 origin-left bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            open ? "scale-x-100" : "scale-x-0"
          }`}
          aria-hidden="true"
        />

        <div className="site-container py-10 lg:py-12">
          <div key={contentKey} className="grid grid-cols-12 gap-8 lg:gap-10">
            <div className="col-span-12 grid grid-cols-2 gap-8 sm:gap-x-6 lg:col-span-9 lg:grid-cols-4 lg:gap-x-8">
              {columns.map((column, index) => (
                <section
                  key={column.title}
                  aria-labelledby={`mega-${column.title}`}
                  className="mega-menu-shell motion-reduce:animate-none animate-mega-menu-item"
                  style={{ animationDelay: `${80 + index * 60}ms` }}
                >
                  <h3
                    id={`mega-${column.title}`}
                    className="section-eyebrow text-accent"
                  >
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={onNavigate}
                          className="font-body text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:text-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={column.viewAll.href}
                    onClick={onNavigate}
                    className="mt-4 inline-block font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
                  >
                    {column.viewAll.label} →
                  </Link>
                </section>
              ))}
            </div>

            <aside
              className="mega-menu-shell col-span-12 motion-reduce:animate-none animate-mega-menu-promo lg:col-span-3"
              style={{ animationDelay: "320ms" }}
            >
              <Link
                href={promo.href}
                onClick={onNavigate}
                className="group/promo relative block aspect-[4/5] overflow-hidden bg-ink"
              >
                <Image
                  src={promo.image}
                  alt={promo.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover/promo:scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/15"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <span className="section-eyebrow text-accent">{promo.tag}</span>
                  <p className="mt-2 max-w-[15rem] font-body text-lg font-extrabold uppercase leading-tight tracking-tight text-paper">
                    {promo.headline}
                  </p>
                  <span className="mt-4 inline-flex w-fit border border-paper/40 px-4 py-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper transition-colors group-hover/promo:border-accent group-hover/promo:text-accent">
                    {promo.cta} →
                  </span>
                </div>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
