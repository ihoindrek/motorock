"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { brands } from "@/data/brands";
import { useCheckoutStep } from "@/context/checkout-step-context";

const shopLinks = [
  { href: "/shop/motorcycles", label: "Motorcycles" },
  { href: "/shop/equipment", label: "Driving equipment" },
  { href: "/shop/equipment/men", label: "Men's gear" },
  { href: "/shop/equipment/women", label: "Women's gear" },
  { href: "/shop/equipment/accessories", label: "Accessories" },
  { href: "/shop/tools", label: "Tools" },
] as const;

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
] as const;

const quickLinks = [
  { href: "/search", label: "Search" },
  { href: "/shop/brands/brixton", label: "Brands" },
  { href: "/cart", label: "Cart & checkout" },
  { href: "/test-ride", label: "Book test ride" },
] as const;

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping" },
] as const;

function SocialIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="relative z-[1] size-[1.125rem] transition-transform duration-300 group-hover:scale-110"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const socialLinks = [
  {
    href: "https://www.instagram.com/motorock.eu",
    label: "Instagram",
    icon: (
      <SocialIcon>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </SocialIcon>
    ),
  },
  {
    href: "https://www.facebook.com/scramblers.caferacers",
    label: "Facebook",
    icon: (
      <SocialIcon>
        <path
          d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z"
          fill="currentColor"
        />
      </SocialIcon>
    ),
  },
  {
    href: "https://www.tiktok.com/@motorock909",
    label: "TikTok",
    icon: (
      <SocialIcon>
        <path
          d="M14.6 5.5c0 1.1.4 2.1 1.1 2.9.7.8 1.7 1.4 2.8 1.6v2.4c-1.4-.1-2.7-.6-3.9-1.5v5.5c0 2.8-2.2 5.1-5 5.1s-5-2.3-5-5.1 2.2-5.1 5-5.1c.3 0 .6 0 .9.1v2.6a2.5 2.5 0 0 0-.9-.2c-1.4 0-2.5 1.1-2.5 2.6S8.2 19 9.6 19s2.5-1.1 2.5-2.6V3h2.5z"
          fill="currentColor"
        />
      </SocialIcon>
    ),
  },
] as const;

function SocialIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group relative inline-flex size-11 items-center justify-center overflow-hidden rounded-full border border-paper/15 bg-paper/[0.04] text-paper/55 transition-[border-color,background-color,color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-paper hover:shadow-[0_10px_28px_rgb(255_90_0_/_0.38)]"
    >
      <span
        className="pointer-events-none absolute inset-0 scale-0 rounded-full bg-accent/20 opacity-0 transition-[transform,opacity] duration-500 group-hover:scale-150 group-hover:opacity-100"
        aria-hidden="true"
      />
      {icon}
    </a>
  );
}

const motorcycleBrands = brands.filter(
  (brand): brand is typeof brand & { logo: string } => Boolean(brand.logo),
);

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-0 font-display text-xs font-bold uppercase tracking-aggressive text-paper/55 transition-colors hover:text-paper sm:text-sm"
      >
        <span
          className="inline-block w-0 overflow-hidden text-[10px] font-bold text-accent transition-all duration-300 group-hover:mr-2 group-hover:w-3"
          aria-hidden="true"
        >
          →
        </span>
        {label}
      </Link>
    </li>
  );
}

function FooterNav({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="section-eyebrow text-paper/50">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3.5">
        {links.map((link) => (
          <FooterLink key={link.href} {...link} />
        ))}
      </ul>
    </nav>
  );
}

function CheckoutFooter() {
  return (
    <footer className="relative text-paper">
      <div className="site-footer-surface relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          aria-hidden="true"
        />
        <div className="site-container relative z-10 py-8 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-eyebrow text-paper/45">Need help?</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-8 sm:gap-y-2">
                <a
                  href="mailto:hello@motorock.eu"
                  className="font-display text-xl font-extrabold uppercase tracking-tight text-paper transition-colors hover:text-accent sm:text-2xl"
                >
                  hello@motorock.eu
                </a>
                <a
                  href="tel:+37255551234"
                  className="font-display text-lg font-bold tabular-nums text-paper/80 transition-colors hover:text-accent sm:text-xl"
                >
                  +372 5555 1234
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:items-end">
              <nav aria-label="Checkout footer">
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-paper/45">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-accent">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <small className="text-xs text-paper/35">
                &copy; {new Date().getFullYear()} Motorock.eu
              </small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const { checkoutStep } = useCheckoutStep();
  const isCheckoutFlow = pathname === "/cart" && checkoutStep !== null;

  if (isCheckoutFlow) {
    return <CheckoutFooter />;
  }

  return (
    <footer className="relative text-paper">
      <div className="site-footer-surface relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          aria-hidden="true"
        />
        <div className="site-container relative z-10">
          <div className="grid gap-12 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
            <section
              aria-labelledby="footer-brand"
              className="flex flex-col gap-6 lg:col-span-5"
            >
              <Link href="/" aria-label="Motorock.eu — Home" className="w-fit">
                <Image
                  src="/logo.png"
                  alt=""
                  width={160}
                  height={50}
                  className="h-9 w-auto brightness-0 invert sm:h-10"
                  sizes="160px"
                />
              </Link>

              <p
                id="footer-brand"
                className="max-w-sm text-sm leading-relaxed text-paper/55"
              >
                Premium motorcycles, riding gear, and tools — curated for
                riders who refuse to blend in. Built in Europe, shipped EU-wide.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map(({ href, label, icon }) => (
                  <SocialIconLink
                    key={label}
                    href={href}
                    label={label}
                    icon={icon}
                  />
                ))}
              </div>

              <address className="not-italic text-sm leading-relaxed text-paper/45">
                <a
                  href="mailto:hello@motorock.eu"
                  className="block text-paper/70 hover:text-accent"
                >
                  hello@motorock.eu
                </a>
                <span className="mt-1 block">Tallinn, Estonia · EU</span>
              </address>
            </section>

            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:col-span-7 lg:grid-cols-3 lg:gap-8">
              <FooterNav id="footer-shop" title="Shop" links={shopLinks} />
              <FooterNav
                id="footer-nav"
                title="Quick links"
                links={quickLinks}
              />
              <FooterNav
                id="footer-company"
                title="Company"
                links={companyLinks}
              />
            </div>
          </div>

          <div className="border-t border-paper/10 py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow text-paper/45">Our brands</p>
                <p className="mt-3 max-w-md text-sm text-paper/45">
                  Official dealer for Europe&apos;s most distinctive motorcycle
                  and gear labels.
                </p>
              </div>
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
                {motorcycleBrands.map((brand) => (
                  <li key={brand.slug}>
                    <Link
                      href={`/shop/brands/${brand.slug}`}
                      className="opacity-45 transition-opacity duration-300 hover:opacity-100"
                    >
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={brand.width ?? 120}
                        height={brand.height ?? 36}
                        className={`${brand.logoClassLg} brightness-0 invert`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-paper/10 py-6 sm:flex-row sm:items-center">
            <small className="text-xs text-paper/35">
              &copy; {new Date().getFullYear()} Motorock.eu. All rights reserved.
            </small>
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-paper/35 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
