import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";

export type CustomerServiceNavId =
  | "support"
  | "terms"
  | "privacy"
  | "returns"
  | "return-product"
  | "shipping"
  | "cookies";

export type CustomerServiceNavItem = {
  id: CustomerServiceNavId;
  href: string;
  label: string;
};

export function getCustomerServiceNavItems(
  locale: Locale,
): readonly CustomerServiceNavItem[] {
  const dict = getDictionary(locale);

  return [
    {
      id: "support",
      href: localizedHref(locale, "/support"),
      label: dict.footer.support,
    },
    {
      id: "terms",
      href: localizedHref(locale, "/terms"),
      label: dict.footer.terms,
    },
    {
      id: "privacy",
      href: localizedHref(locale, "/privacy"),
      label: dict.footer.privacy,
    },
    {
      id: "returns",
      href: localizedHref(locale, "/returns"),
      label: dict.footer.returns,
    },
    {
      id: "return-product",
      href: `${localizedHref(locale, "/returns")}#withdrawal-form`,
      label: dict.footer.returnProduct,
    },
    {
      id: "shipping",
      href: localizedHref(locale, "/shipping"),
      label: dict.footer.shipping,
    },
    {
      id: "cookies",
      href: localizedHref(locale, "/cookies"),
      label: dict.footer.cookies,
    },
  ];
}
