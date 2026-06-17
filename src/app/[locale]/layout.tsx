import { notFound } from "next/navigation";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { LocaleAlternatesProvider } from "@/context/locale-alternates-context";
import { LocaleProvider } from "@/context/locale-context";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);

  return (
    <LocaleProvider locale={localeParam} dictionary={dictionary}>
      <LocaleAlternatesProvider>
        <a href="#main-content" className="sr-only-focusable">
          {dictionary.common.skipToContent}
        </a>

        <SiteHeader />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <SiteFooter />

        <CartDrawer />
      </LocaleAlternatesProvider>
    </LocaleProvider>
  );
}
