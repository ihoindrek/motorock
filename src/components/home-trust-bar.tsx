import { MapPin, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentCategoryHref } from "@/lib/shop/category-url";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    ariaLabel: "Why shop with Motorock",
    shipping: "EU-Wide Shipping",
    returns: "Easy 14-Day Returns",
    protection: "CE Certified Protection",
    showroom: "Showroom in Tallinn",
  },
  et: {
    ariaLabel: "Miks osta Motorockist",
    shipping: "Tarne üle EL-i",
    returns: "Lihtne 14-päevane tagastus",
    protection: "CE-sertifitseeritud kaitse",
    showroom: "Showroom Tallinnas",
  },
} as const;

type TrustItem = {
  Icon: typeof Truck;
  label: string;
  href: string;
};

export function HomeTrustBar({ locale }: { locale: Locale }) {
  const t = copy[locale];

  const items: TrustItem[] = [
    {
      Icon: Truck,
      label: t.shipping,
      href: localizedHref(locale, "/shipping"),
    },
    {
      Icon: RotateCcw,
      label: t.returns,
      href: localizedHref(locale, "/returns"),
    },
    {
      Icon: ShieldCheck,
      label: t.protection,
      href: localizedHref(locale, buildEquipmentCategoryHref(locale, "protection")),
    },
    {
      Icon: MapPin,
      label: t.showroom,
      href: localizedHref(locale, "/contact"),
    },
  ];

  return (
    <section
      aria-label={t.ariaLabel}
      className="border-b border-ink/10 bg-ink text-paper"
    >
      <div className="site-container">
        <ul className="grid grid-cols-2 divide-x divide-y divide-paper/10 lg:grid-cols-4 lg:divide-y-0">
          {items.map(({ Icon, label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className={cn(
                  "group flex min-h-14 flex-col items-center justify-center gap-1.5 px-3 py-3 text-center",
                  "font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/85",
                  "transition-colors duration-200 hover:bg-paper/5 hover:text-paper",
                  "lg:min-h-14 lg:flex-row lg:gap-2.5 lg:px-5 lg:text-xs",
                )}
              >
                <Icon
                  className="size-4 shrink-0 text-accent transition-transform duration-200 group-hover:scale-110 sm:size-[18px]"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <span className="text-center leading-snug">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
