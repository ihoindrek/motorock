import type { ReactNode } from "react";
import { CustomerServiceSidebar } from "@/components/legal/customer-service-sidebar";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { CustomerServiceNavId } from "@/lib/legal/customer-service-nav";

type CustomerServiceLayoutProps = {
  locale: Locale;
  currentId: CustomerServiceNavId;
  title: string;
  description?: string;
  updated?: string;
  lastUpdatedLabel?: string;
  children: ReactNode;
};

export function CustomerServiceLayout({
  locale,
  currentId,
  title,
  description,
  updated,
  lastUpdatedLabel,
  children,
}: CustomerServiceLayoutProps) {
  const dict = getDictionary(locale);

  return (
    <article className="bg-paper text-ink">
      <div className="site-container py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:gap-20">
          <CustomerServiceSidebar
            locale={locale}
            currentId={currentId}
            title={dict.legal.customerServiceTitle}
          />

          <div className="min-w-0">
            <header className="max-w-3xl">
              <h1 className="font-body text-xl font-semibold text-ink sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-4 text-base leading-relaxed text-ink/75">
                  {description}
                </p>
              ) : null}
              {updated && lastUpdatedLabel ? (
                <p className="mt-6 font-body text-xs text-ink/45">
                  {lastUpdatedLabel} {updated}
                </p>
              ) : null}
            </header>

            <div className="mt-8 max-w-3xl">{children}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
