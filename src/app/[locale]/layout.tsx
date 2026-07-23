import { notFound } from "next/navigation";
import { CookieConsentUi } from "@/components/consent/cookie-consent-ui";
import { GiveawayPopup } from "@/components/marketing/giveaway-popup";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { CategoryTreeProvider } from "@/context/category-tree-context";
import { ConsentProvider } from "@/context/consent-context";
import { LocaleAlternatesProvider } from "@/context/locale-alternates-context";
import { LocaleProvider } from "@/context/locale-context";
import { ScrollToTopOnNavigate } from "@/components/navigation/scroll-to-top-on-navigate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MainContent } from "@/components/layout/main-content";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo/site-schema";
import { fetchEquipmentCategoryIndex, navTreeFromIndex } from "@/lib/graphql/categories";
import { TOOLS_WC_SLUG } from "@/lib/shop/wc-categories";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const categoryIndex = await fetchEquipmentCategoryIndex(localeParam);
  const categoryTree = categoryIndex
    ? navTreeFromIndex(categoryIndex)
    : null;
  const toolsCategory = categoryIndex?.nodes.get(TOOLS_WC_SLUG) ?? null;

  return (
    <LocaleProvider locale={localeParam} dictionary={dictionary}>
      <ConsentProvider>
        <CategoryTreeProvider tree={categoryTree} toolsCategory={toolsCategory}>
          <LocaleAlternatesProvider>
            <JsonLd schema={buildOrganizationJsonLd()} />
            <JsonLd schema={buildWebsiteJsonLd(localeParam)} />

            <a href="#main-content" className="sr-only-focusable">
              {dictionary.common.skipToContent}
            </a>

            <SiteHeader />

            <ScrollToTopOnNavigate />

            <MainContent>{children}</MainContent>

            <SiteFooter />

            <CartDrawer />
            <CookieConsentUi />
            {localeParam === "en" ? <GiveawayPopup /> : null}
          </LocaleAlternatesProvider>
        </CategoryTreeProvider>
      </ConsentProvider>
    </LocaleProvider>
  );
}
