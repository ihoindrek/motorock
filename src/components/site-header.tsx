"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/cart-context";
import { useCheckoutStep } from "@/context/checkout-step-context";
import { useCategoryTree, useToolsCategory } from "@/context/category-tree-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { useLocaleAlternates } from "@/context/locale-alternates-context";
import { useWishlist } from "@/context/wishlist-context";
import type { Locale } from "@/i18n/config";
import {
  getShopNav,
  getSiteNav,
} from "@/i18n/navigation";
import { localizedHref, stripLocaleFromPath, switchLocaleInPath } from "@/i18n/paths";
import {
  isProductPath,
  resolveProductHrefForLocaleSwitch,
} from "@/lib/shop/product-url";
import type { PrimaryNavItem } from "@/data/navigation";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { EquipmentMegaMenu } from "@/components/navigation/equipment-mega-menu";
import { HeaderSearch } from "@/components/navigation/header-search";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { MenuToggle } from "@/components/ui/menu-toggle";
import { cn } from "@/lib/utils";

function CartIcon() {
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
      <path d="M6 6h15l-1.5 9h-12L6 6z" />
      <path d="M6 6L5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function WishlistIcon() {
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
      <path d="M12 21s-6.5-4.35-9.33-8.04C.74 10.4 1.1 6.9 3.7 5.2c1.9-1.25 4.35-.9 5.8.7L12 8.35l2.5-2.45c1.45-1.6 3.9-1.95 5.8-.7 2.6 1.7 2.96 5.2 1.03 7.76C18.5 16.65 12 21 12 21z" />
    </svg>
  );
}

function LanguageSwitcher({
  locale,
  onChange,
  inverted = false,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  inverted?: boolean;
}) {
  const options = [
    { code: "en" as const, label: "EN" },
    { code: "et" as const, label: "ET" },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "relative inline-grid grid-cols-2 rounded-sm border p-0.5 font-body text-[9px] font-bold uppercase tracking-aggressive sm:text-[10px]",
        inverted ? "border-paper/20" : "border-ink/15",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0.5 w-[calc(50%-2px)] rounded-sm transition-[left,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          locale === "en" ? "left-0.5" : "left-[calc(50%+1px)]",
          inverted ? "bg-paper" : "bg-ink",
        )}
      />
      {options.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
          className={cn(
            "relative z-[1] min-w-[2rem] px-2 py-1 transition-colors duration-200 sm:min-w-[2.35rem] sm:px-2.5 sm:py-1.5",
            locale === code
              ? inverted
                ? "text-ink"
                : "text-paper"
              : inverted
                ? "text-paper/45 hover:text-paper/75"
                : "text-ink/45 hover:text-ink/75",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const EQUIPMENT_CLOSE_DELAY_MS = 120;

function NavDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <li
      aria-hidden="true"
      className="mx-0.5 flex items-center self-stretch py-2 xl:mx-1"
    >
      <span
        className={cn(
          "block h-4 w-px shrink-0",
          inverted ? "bg-paper/20" : "bg-ink/15",
        )}
      />
    </li>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const dictionary = useDictionary();
  const categoryTree = useCategoryTree();
  const toolsCategory = useToolsCategory();
  const localeAlternates = useLocaleAlternates();
  const shopNav = useMemo(
    () => getShopNav(locale, dictionary, categoryTree, toolsCategory),
    [locale, dictionary, categoryTree, toolsCategory],
  );
  const siteNav = useMemo(
    () => getSiteNav(locale, dictionary),
    [locale, dictionary],
  );
  const equipmentMegaMenu = useMemo(
    () => shopNav.find((item) => item.megaMenu)?.megaMenu ?? null,
    [shopNav],
  );
  const { itemCount, toggleCart, drawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { checkoutStep } = useCheckoutStep();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const equipmentCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeEquipmentMenuImmediately = () => {
    if (equipmentCloseTimer.current) {
      clearTimeout(equipmentCloseTimer.current);
      equipmentCloseTimer.current = null;
    }

    setEquipmentOpen(false);
  };

  const openEquipmentMenu = () => {
    if (equipmentCloseTimer.current) {
      clearTimeout(equipmentCloseTimer.current);
      equipmentCloseTimer.current = null;
    }
    setEquipmentOpen(true);
  };

  const closeEquipmentMenu = () => {
    if (equipmentCloseTimer.current) {
      clearTimeout(equipmentCloseTimer.current);
    }
    equipmentCloseTimer.current = setTimeout(() => {
      setEquipmentOpen(false);
      equipmentCloseTimer.current = null;
    }, EQUIPMENT_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    closeEquipmentMenuImmediately();
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (equipmentCloseTimer.current) {
        clearTimeout(equipmentCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 4);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isCheckoutPage = stripLocaleFromPath(pathname) === "/cart";
  const isCheckoutHeader = isCheckoutPage && checkoutStep !== null;

  const handleLocaleChange = (nextLocale: Locale) => {
    const translatedSlug = localeAlternates?.[nextLocale];
    const basePath = stripLocaleFromPath(pathname);

    if (translatedSlug && isProductPath(basePath)) {
      const productHref = resolveProductHrefForLocaleSwitch(
        localeAlternates ?? {},
        nextLocale,
      );

      if (productHref) {
        router.push(productHref);
        return;
      }
    }

    if (translatedSlug && basePath.startsWith("/blog/")) {
      router.push(localizedHref(nextLocale, `/blog/${translatedSlug}`));
      return;
    }

    router.push(switchLocaleInPath(pathname, nextLocale));
  };

  const navTextColor = (
    group: PrimaryNavItem["group"],
    options: { scrolled: boolean; accent?: boolean },
  ) => {
    if (options.accent) return "text-accent";
    if (group === "shop") {
      return options.scrolled ? "text-paper" : "text-ink";
    }
    return options.scrolled ? "text-paper/75" : "text-ink/75";
  };

  const renderNavItem = (item: PrimaryNavItem) =>
    item.megaMenu ? (
      <li
        key={item.href}
        onMouseEnter={openEquipmentMenu}
        onMouseLeave={closeEquipmentMenu}
        onFocus={openEquipmentMenu}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            closeEquipmentMenu();
          }
        }}
      >
        <Link
          href={item.href}
          onClick={closeEquipmentMenuImmediately}
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap font-body text-sm font-bold uppercase tracking-aggressive transition-colors hover:text-accent",
            navTextColor(item.group, {
              scrolled,
              accent: equipmentOpen,
            }),
          )}
          aria-haspopup="true"
          aria-expanded={equipmentOpen}
          aria-controls="mega-menu-equipment"
        >
          {item.label}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`size-3 transition-transform duration-150 ${
              equipmentOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </Link>
      </li>
    ) : (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "whitespace-nowrap font-body text-sm font-bold uppercase tracking-aggressive transition-colors hover:text-accent",
            navTextColor(item.group, { scrolled }),
          )}
        >
          {item.label}
        </Link>
      </li>
    );

  return (
    <header
      className={cn(
        "relative sticky top-0 z-50 transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-ink shadow-none" : "bg-white shadow-none",
      )}
    >
      <div className="site-container relative z-[1] flex h-16 items-center gap-4 sm:h-20 lg:gap-8">
        <Link
          href={localizedHref(locale, "/")}
          aria-label="Motorock.eu — Home"
          className="shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Motorock.eu"
            width={160}
            height={50}
            priority
            className={cn(
              "h-8 w-auto transition-[filter] duration-300 sm:h-10",
              scrolled && "brightness-0 invert",
            )}
            sizes="(max-width: 640px) 128px, 160px"
          />
        </Link>

        <nav
          aria-label="Primary navigation"
          className={cn("hidden flex-1 lg:block", isCheckoutHeader && "lg:hidden")}
        >
          <ul className="flex items-center justify-center gap-5 xl:gap-8">
            {shopNav.map(renderNavItem)}
            <NavDivider inverted={scrolled} />
            {siteNav.map(renderNavItem)}
          </ul>
        </nav>

        {isCheckoutHeader ? (
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <CheckoutProgress
              currentStep={checkoutStep}
              variant="header"
              inverted={scrolled}
            />
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
          <LanguageSwitcher
            locale={locale}
            onChange={handleLocaleChange}
            inverted={scrolled}
          />

          <HeaderSearch inverted={scrolled} />

          <Link
            href={localizedHref(locale, "/wishlist")}
            aria-label={`${dictionary.wishlist.open}${wishlistCount > 0 ? `, ${wishlistCount}` : ""}`}
            className={cn(
              "relative inline-flex size-10 items-center justify-center transition-colors hover:text-accent",
              scrolled ? "text-paper" : "text-ink",
              isCheckoutHeader && "hidden",
            )}
          >
            <WishlistIcon />
            {wishlistCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-body text-[9px] font-bold leading-4 text-paper">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            aria-label={`Shopping cart, ${itemCount} items`}
            aria-expanded={drawerOpen}
            aria-controls="cart-drawer"
            onClick={toggleCart}
            className={cn(
              "relative inline-flex size-10 items-center justify-center transition-colors hover:text-accent",
              scrolled ? "text-paper" : "text-ink",
            )}
          >
            <CartIcon />
            {itemCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-body text-[9px] font-bold leading-4 text-paper">
                {itemCount}
              </span>
            ) : null}
          </button>

          <div
            className={cn(
              "inline-flex size-11 items-center justify-center transition-colors hover:text-accent lg:hidden",
              scrolled ? "text-paper" : "text-ink",
              isCheckoutHeader && "hidden",
            )}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <MenuToggle
              open={mobileOpen}
              onOpenChange={setMobileOpen}
              strokeWidth={2.5}
              className="size-6"
            />
          </div>
        </div>
      </div>

      {isCheckoutHeader ? (
        <div
          className={cn(
            "border-t lg:hidden",
            scrolled ? "border-paper/10 bg-ink" : "border-ink/10 bg-white",
          )}
        >
          <div className="site-container py-3">
            <CheckoutProgress
              currentStep={checkoutStep}
              variant="header"
              inverted={scrolled}
            />
          </div>
        </div>
      ) : null}

      {equipmentMegaMenu ? (
        <EquipmentMegaMenu
          megaMenu={equipmentMegaMenu}
          ariaLabel={dictionary.nav.equipment}
          open={equipmentOpen}
          onMouseEnter={openEquipmentMenu}
          onMouseLeave={closeEquipmentMenu}
          onNavigate={closeEquipmentMenuImmediately}
        />
      ) : null}

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
