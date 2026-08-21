"use client";

import { useState, useMemo, type ReactNode } from "react";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { CheckoutSelectionCheck } from "@/components/shop/checkout-selection-check";
import { resolvePaymentMethodVisual } from "@/lib/shop/payment-method-visual";
import {
  MONTONIO_PAYMENT_METHOD_ID,
  type PaymentGateway,
} from "@/lib/graphql/checkout";
import {
  filterHeadlessDisabledMontonioFinancingGateways,
  filterHeadlessDisabledMontonioFinancingOptions,
  MONTONIO_CARD_PAYMENT_METHOD_ID,
} from "@/lib/checkout/montonio-checkout";
import { isLiveCheckoutEnabled } from "@/lib/checkout-mode";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getLocalizedMontonioGatewayDefs,
  localizeBankDisplayName,
  localizePaymentGateway,
} from "@/lib/shop/localize-payment-gateway";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import {
  montonioOptionKey,
  montonioOptionLabel,
} from "@/types/montonio-payment";
import { isMontonioPaymentCountry } from "@/lib/montonio/payment-countries";
import {
  isWooPaymentsGateway,
  wooPaymentsWalletForGatewayId,
  WOO_PAYMENTS_APPLE_PAY_GATEWAY_ID,
  WOO_PAYMENTS_CARD_GATEWAY_ID,
  WOO_PAYMENTS_GATEWAY_ID,
  WOO_PAYMENTS_GOOGLE_PAY_GATEWAY_ID,
} from "@/lib/checkout/woo-payments";
import { cn } from "@/lib/utils";
import { CheckoutSupportNotice } from "@/components/shop/checkout-support-notice";
import { CheckoutCardBrandIcons } from "@/components/shop/checkout-card-brand-icons";

function isMontonioGateway(gateway: PaymentGateway) {
  return gateway.id.toLowerCase().includes("montonio");
}

export function isMontonioCardGateway(gateway: PaymentGateway) {
  return gateway.id === MONTONIO_CARD_PAYMENT_METHOD_ID;
}

export function isBankMontonioGateway(gateway: PaymentGateway) {
  const haystack = `${gateway.id} ${gateway.title}`.toLowerCase();

  return (
    gateway.id === MONTONIO_PAYMENT_METHOD_ID ||
    haystack.includes("bank") ||
    haystack.includes("pang") ||
    haystack.includes("pay with your")
  );
}

/** True when the customer must pick inside the expanded Montonio panel. */
export function gatewayNeedsMontonioSubselection(
  gateway: PaymentGateway,
  options: MontonioPaymentOption[],
) {
  const scopedOptions = filterMontonioOptionsForGateway(gateway, options);

  if (scopedOptions.length === 0) {
    return false;
  }

  if (isBankMontonioGateway(gateway)) {
    return true;
  }

  return scopedOptions.length > 1;
}

export function filterMontonioOptionsForGateway(
  gateway: PaymentGateway,
  options: MontonioPaymentOption[],
) {
  if (!isMontonioGateway(gateway)) {
    return [];
  }

  const haystack = `${gateway.id} ${gateway.title}`.toLowerCase();

  if (haystack.includes("mobilepay") || haystack.includes("mobile pay")) {
    return options.filter((option) => option.kind === "mobilePay");
  }

  if (haystack.includes("card")) {
    return options.filter((option) => option.kind === "card");
  }

  if (haystack.includes("blik")) {
    return options.filter((option) => option.kind === "blik");
  }

  if (
    haystack.includes("bnpl") ||
    haystack.includes("pay later") ||
    haystack.includes("maksa hiljem")
  ) {
    return options.filter((option) => option.kind === "bnpl");
  }

  if (
    haystack.includes("hire") ||
    haystack.includes("järelmaks") ||
    gateway.id === "wc_montonio_hire_purchase"
  ) {
    return options.filter((option) => option.kind === "hirePurchase");
  }

  if (isBankMontonioGateway(gateway)) {
    return options.filter(
      (option) =>
        option.kind === "bank" && option.systemName === "paymentInitiation",
    );
  }

  return options;
}

const SYNTHETIC_MONTONIO_GATEWAY_ORDER = [
  MONTONIO_PAYMENT_METHOD_ID,
  "wc_montonio_card",
  "wc_montonio_mobilepay",
  "wc_montonio_hire_purchase",
  "wc_montonio_bnpl",
  "wc_montonio_blik",
] as const;

/** Add Montonio gateways that Woo did not return but Montonio API supports. */
export function expandMontonioPaymentGateways(
  gateways: PaymentGateway[],
  montonioOptions: MontonioPaymentOption[],
  locale: Locale,
) {
  const existingIds = new Set(gateways.map((gateway) => gateway.id));
  const extras: PaymentGateway[] = [];
  const syntheticDefs = getLocalizedMontonioGatewayDefs(locale);

  for (const def of syntheticDefs) {
    if (existingIds.has(def.id)) {
      continue;
    }

    const synthetic: PaymentGateway = {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: null,
    };

    if (
      filterMontonioOptionsForGateway(synthetic, montonioOptions).length > 0
    ) {
      extras.push(synthetic);
    }
  }

  const localized = gateways.map((gateway) =>
    localizePaymentGateway(gateway, locale),
  );

  const merged =
    extras.length === 0
      ? localized
      : [...localized, ...extras];

  return merged.sort((left, right) => {
    const leftIndex = SYNTHETIC_MONTONIO_GATEWAY_ORDER.indexOf(
      left.id as (typeof SYNTHETIC_MONTONIO_GATEWAY_ORDER)[number],
    );
    const rightIndex = SYNTHETIC_MONTONIO_GATEWAY_ORDER.indexOf(
      right.id as (typeof SYNTHETIC_MONTONIO_GATEWAY_ORDER)[number],
    );

    if (leftIndex === -1 && rightIndex === -1) {
      return 0;
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

/** Hide Montonio gateways that have no providers for the selected country. */
export function filterGatewaysWithMontonioOptions(
  gateways: PaymentGateway[],
  montonioOptions: MontonioPaymentOption[],
  wooGatewayIds?: ReadonlySet<string>,
) {
  return gateways.filter((gateway) => {
    if (!isMontonioGateway(gateway)) {
      return true;
    }

    if (wooGatewayIds?.has(gateway.id)) {
      return true;
    }

    return (
      filterMontonioOptionsForGateway(gateway, montonioOptions).length > 0
    );
  });
}

function hasBankPaymentInitiationOptions(options: MontonioPaymentOption[]) {
  return options.some(
    (option) =>
      option.kind === "bank" && option.systemName === "paymentInitiation",
  );
}

/** Inject bank link when Montonio API has banks but Woo omitted wc_montonio_payments. */
export function ensureLiveBankPaymentGateway(
  gateways: PaymentGateway[],
  montonioOptions: MontonioPaymentOption[],
  locale: Locale,
) {
  if (!hasBankPaymentInitiationOptions(montonioOptions)) {
    return gateways;
  }

  if (gateways.some((gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID)) {
    return gateways;
  }

  const bankDef = getLocalizedMontonioGatewayDefs(locale).find(
    (def) => def.id === MONTONIO_PAYMENT_METHOD_ID,
  );

  if (!bankDef) {
    return gateways;
  }

  return [
    {
      id: bankDef.id,
      title: bankDef.title,
      description: bankDef.description,
      icon: null,
    },
    ...gateways,
  ];
}

/** Hide regional Montonio gateways outside supported countries. */
export function filterMontonioGatewaysByCountry(
  gateways: PaymentGateway[],
  country: string | null | undefined,
) {
  if (isMontonioPaymentCountry(country)) {
    return gateways;
  }

  return gateways.filter((gateway) => !isMontonioGateway(gateway));
}

function filterMontonioOptionsByCountry(
  options: MontonioPaymentOption[],
  country: string | null | undefined,
) {
  if (isMontonioPaymentCountry(country)) {
    return options;
  }

  return [];
}

/** Prefer WooPayments for EU buyers outside Montonio bank-link markets. */
export function sortPaymentGatewaysForCountry(
  gateways: PaymentGateway[],
  country?: string | null,
) {
  if (isMontonioPaymentCountry(country)) {
    return gateways;
  }

  const wooPayments = gateways.filter((gateway) =>
    isWooPaymentsGateway(gateway.id),
  );
  const rest = gateways.filter(
    (gateway) => !isWooPaymentsGateway(gateway.id),
  );

  return [...wooPayments, ...rest];
}

/**
 * Live checkout exposes Woo-enabled Montonio gateways plus any Montonio API
 * providers missing from Woo (e.g. bank link when Vercel only gets card).
 */
export function resolveVisiblePaymentGateways(
  gateways: PaymentGateway[],
  montonioOptions: MontonioPaymentOption[],
  locale: Locale,
  liveCheckout: boolean,
  country?: string | null,
) {
  const montonioAllowed = isMontonioPaymentCountry(country);
  const scopedGateways = filterHeadlessDisabledMontonioFinancingGateways(
    montonioAllowed
      ? gateways
      : filterMontonioGatewaysByCountry(gateways, country),
  );
  const scopedOptions = filterHeadlessDisabledMontonioFinancingOptions(
    filterMontonioOptionsByCountry(montonioOptions, country),
  );

  const wooGatewayIds = new Set(scopedGateways.map((gateway) => gateway.id));
  const base = liveCheckout
    ? ensureLiveBankPaymentGateway(scopedGateways, scopedOptions, locale)
    : scopedGateways;

  return sortPaymentGatewaysForCountry(
    filterHeadlessDisabledMontonioFinancingGateways(
      filterGatewaysWithMontonioOptions(
        expandMontonioPaymentGateways(base, scopedOptions, locale),
        scopedOptions,
        wooGatewayIds,
      ).map((gateway) => localizePaymentGateway(gateway, locale)),
    ),
    country,
  );
}

const CARD_PAYMENT_LOGO_SIZES = {
  container: "h-12 w-[7.5rem] sm:h-14 sm:w-[9.5rem]",
  image: "h-11 max-w-full sm:h-14",
  width: 152,
  height: 56,
} as const;

function PaymentMethodIcon({
  gateway,
  className,
}: {
  gateway: PaymentGateway;
  className?: string;
}) {
  const visual = resolvePaymentMethodVisual(
    gateway.id,
    gateway.title,
    gateway.icon,
  );
  const [logoFailed, setLogoFailed] = useState(false);
  const isCardLayout = visual.kind === "logo" && visual.layout === "card";

  if (visual.kind === "card-brands") {
    return (
      <span aria-hidden="true">
        <CheckoutCardBrandIcons variant="compact" />
      </span>
    );
  }

  if (visual.kind === "logo" && !logoFailed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          isCardLayout ? CARD_PAYMENT_LOGO_SIZES.container : className,
        )}
      >
        <img
          src={visual.src}
          alt={visual.alt}
          width={isCardLayout ? CARD_PAYMENT_LOGO_SIZES.width : 50}
          height={isCardLayout ? CARD_PAYMENT_LOGO_SIZES.height : 33}
          className={cn(
            "w-auto object-contain",
            isCardLayout ? CARD_PAYMENT_LOGO_SIZES.image : "h-7 max-w-full",
          )}
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  const fallback =
    visual.kind === "initials"
      ? visual.label
      : (gateway.title ?? "")
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? "")
          .join("") || "Pay";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-white font-body text-[10px] font-bold uppercase tracking-wide text-ink/70",
        className,
      )}
      aria-hidden="true"
    >
      {fallback}
    </span>
  );
}

function formatBankDisplayName(name: string, locale: Locale) {
  return localizeBankDisplayName(name, locale);
}

function BankLinkButton({
  option,
  selected,
  onSelect,
  locale,
}: {
  option: MontonioPaymentOption;
  selected: boolean;
  onSelect: (option: MontonioPaymentOption) => void;
  locale: Locale;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const label = formatBankDisplayName(option.name, locale);

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        "group relative flex min-h-[3.75rem] w-full items-center justify-center border bg-white px-3 py-3 transition-all duration-200 sm:min-h-[4.25rem]",
        selected
          ? "border-accent ring-2 ring-accent/20 shadow-sm"
          : "border-ink/12 hover:-translate-y-px hover:border-ink/25 hover:shadow-[0_8px_20px_rgb(11_11_11_/_0.06)]",
      )}
    >
      {option.logoUrl && !logoFailed ? (
        <img
          src={option.logoUrl}
          alt=""
          width={88}
          height={32}
          className={cn(
            "max-h-9 w-auto max-w-[5.75rem] object-contain sm:max-h-10 sm:max-w-[6.25rem]",
            selected ? "opacity-100" : "opacity-90 group-hover:opacity-100",
          )}
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="font-body text-xs font-bold uppercase tracking-wide text-ink/55">
          {label.slice(0, 4)}
        </span>
      )}
      {selected ? (
        <CheckoutSelectionCheck
          selected
          size="sm"
          className="absolute right-2 top-2"
        />
      ) : null}
    </button>
  );
}

function BankLinksSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <li
          key={index}
          className="min-h-[3.75rem] animate-pulse border border-ink/10 bg-white sm:min-h-[4.25rem]"
          aria-hidden="true"
        />
      ))}
    </ul>
  );
}

function MontonioSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
        {title}
      </p>
      {children}
    </section>
  );
}

function MontonioProviderList({
  gateway,
  options,
  loading,
  error,
  configured,
  selectedKey,
  onSelect,
  locale,
}: {
  gateway: PaymentGateway;
  options: MontonioPaymentOption[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  selectedKey: string | null;
  onSelect: (option: MontonioPaymentOption) => void;
  locale: Locale;
}) {
  const scopedOptions = filterMontonioOptionsForGateway(gateway, options);
  const copy = getDictionary(locale).checkout;

  if (loading) {
    return (
      <div className="border border-t-0 border-ink/10 bg-paper/40 px-3 py-4 sm:px-4">
        {isBankMontonioGateway(gateway) ? (
          <>
            <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              {copy.paymentChooseBank}
            </p>
            <BankLinksSkeleton />
          </>
        ) : (
          <div className="flex flex-col items-center py-4">
            <MorphingSquare message={copy.paymentLoading} size="sm" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  if (!configured) {
    return <p className="text-sm text-ink/55">{copy.paymentNotConfigured}</p>;
  }

  if (scopedOptions.length === 0) {
    return <p className="text-sm text-ink/55">{copy.paymentMethodsEmpty}</p>;
  }

  const banks = scopedOptions.filter(
    (option) =>
      option.kind === "bank" && option.systemName === "paymentInitiation",
  );
  const card = scopedOptions.filter((option) => option.kind === "card");
  const financing = scopedOptions
    .filter((option) => option.kind === "bnpl" || option.kind === "hirePurchase")
    .sort((left, right) => {
      // Hire purchase (järelmaks) before BNPL (maksa hiljem).
      const order = { hirePurchase: 0, bnpl: 1 } as const;
      return (
        (order[left.kind as keyof typeof order] ?? 99) -
        (order[right.kind as keyof typeof order] ?? 99)
      );
    });
  const blik = scopedOptions.filter((option) => option.kind === "blik");
  const isSelected = (option: MontonioPaymentOption) =>
    selectedKey === montonioOptionKey(option);
  const hideFinancingHeading =
    financing.length > 0 &&
    !isBankMontonioGateway(gateway) &&
    (gateway.id === "wc_montonio_bnpl" ||
      `${gateway.title}`.toLowerCase().includes("pay later") ||
      `${gateway.title}`.toLowerCase().includes("maksa hiljem"));

  return (
    <div className="space-y-4 border border-t-0 border-ink/10 bg-paper/40 px-3 py-4 sm:px-4">
      {banks.length > 0 ? (
        <MontonioSection title={copy.paymentChooseBank}>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {banks.map((option) => (
              <li key={montonioOptionKey(option)} className="min-w-0">
                <BankLinkButton
                  option={option}
                  selected={isSelected(option)}
                  onSelect={onSelect}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        </MontonioSection>
      ) : null}

      {card.length > 0 ? (
        <div className={banks.length > 0 ? "border-t border-ink/8 pt-4" : undefined}>
          {card.map((option) => (
            <MontonioOptionRow
              key={montonioOptionKey(option)}
              option={option}
              selected={isSelected(option)}
              onSelect={onSelect}
              label={montonioOptionLabel(option, locale)}
            />
          ))}
        </div>
      ) : null}

      {financing.length > 0 ? (
        hideFinancingHeading ? (
          <ul
            className={cn(
              "grid gap-2",
              banks.length > 0 || card.length > 0
                ? "border-t border-ink/8 pt-4"
                : undefined,
            )}
          >
            {financing.map((option) => (
              <li key={montonioOptionKey(option)}>
                <MontonioOptionRow
                  option={option}
                  selected={isSelected(option)}
                  onSelect={onSelect}
                  label={montonioOptionLabel(option, locale)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <MontonioSection
            title={copy.paymentFinancing}
            className={
              banks.length > 0 || card.length > 0
                ? "border-t border-ink/8 pt-4"
                : undefined
            }
          >
            <ul className="grid gap-2">
              {financing.map((option) => (
                <li key={montonioOptionKey(option)}>
                  <MontonioOptionRow
                    option={option}
                    selected={isSelected(option)}
                    onSelect={onSelect}
                    label={montonioOptionLabel(option, locale)}
                  />
                </li>
              ))}
            </ul>
          </MontonioSection>
        )
      ) : null}

      {blik.length > 0 ? (
        <MontonioSection
          title={copy.paymentMethodsBlik}
          className="border-t border-ink/8 pt-4"
        >
          <ul className="grid gap-2">
            {blik.map((option) => (
              <li key={montonioOptionKey(option)}>
                <MontonioOptionRow
                  option={option}
                  selected={isSelected(option)}
                  onSelect={onSelect}
                  label={montonioOptionLabel(option, locale)}
                />
              </li>
            ))}
          </ul>
        </MontonioSection>
      ) : null}
    </div>
  );
}

function MontonioOptionRow({
  option,
  selected,
  onSelect,
  label,
}: {
  option: MontonioPaymentOption;
  selected: boolean;
  onSelect: (option: MontonioPaymentOption) => void;
  label?: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const displayName = label ?? option.name;
  const isCardOption = option.kind === "card";

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-white shadow-sm"
          : "border-ink/15 bg-white hover:border-ink/30 hover:shadow-sm",
      )}
    >
      {option.logoUrl && !logoFailed ? (
        <img
          src={option.logoUrl}
          alt=""
          width={isCardOption ? CARD_PAYMENT_LOGO_SIZES.width : 50}
          height={isCardOption ? CARD_PAYMENT_LOGO_SIZES.height : 33}
          className={cn(
            "w-auto object-contain",
            isCardOption
              ? `${CARD_PAYMENT_LOGO_SIZES.image} max-w-[7.5rem] sm:max-w-[9.5rem]`
              : "h-7 max-w-[4rem]",
          )}
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-md border border-ink/10 bg-white font-body text-[10px] font-bold uppercase text-ink/55",
            isCardOption ? CARD_PAYMENT_LOGO_SIZES.container : "size-10",
          )}
        >
          {displayName.slice(0, 3)}
        </span>
      )}
      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
        {displayName}
      </span>
      <CheckoutSelectionCheck selected={selected} />
    </button>
  );
}

function PaymentMethodButton({
  gateway,
  selected,
  onSelect,
}: {
  gateway: PaymentGateway;
  selected: boolean;
  onSelect: (gatewayId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(gateway.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-white shadow-sm"
          : "border-ink/15 bg-white hover:border-ink/30 hover:shadow-sm",
      )}
    >
      <PaymentMethodIcon gateway={gateway} className="size-10" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-ink">
          {gateway.title}
        </span>
        {gateway.description ? (
          <span className="mt-0.5 block text-xs leading-snug text-ink/55">
            {gateway.description}
          </span>
        ) : null}
      </span>
      <CheckoutSelectionCheck selected={selected} />
    </button>
  );
}

export function CheckoutPaymentOptionsSkeleton({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <MorphingSquare message={message} size="sm" />
    </div>
  );
}

export function CheckoutPaymentOptions({
  gateways,
  selectedId,
  onSelect,
  montonioOptions,
  montonioLoading,
  montonioError,
  montonioConfigured,
  selectedMontonioKey,
  onSelectMontonioOption,
  loading,
  error,
  locale,
  renderWooPaymentsExpandedPanel,
  wooPaymentsLoading,
  wooPaymentsError,
  wooPaymentsFormError,
  wooPaymentsExpressError,
}: {
  gateways: PaymentGateway[];
  selectedId: string | null;
  onSelect: (gatewayId: string) => void;
  montonioOptions: MontonioPaymentOption[];
  montonioLoading: boolean;
  montonioError: string | null;
  montonioConfigured: boolean;
  selectedMontonioKey: string | null;
  onSelectMontonioOption: (option: MontonioPaymentOption | null) => void;
  loading: boolean;
  error: string | null;
  locale: Locale;
  renderWooPaymentsExpandedPanel?: (gatewayId: string) => ReactNode | null;
  wooPaymentsLoading?: boolean;
  wooPaymentsError?: string | null;
  wooPaymentsFormError?: string | null;
  wooPaymentsExpressError?: string | null;
}) {
  const copy = getDictionary(locale).checkout;
  const localizedGateways = useMemo(
    () => gateways.map((gateway) => localizePaymentGateway(gateway, locale)),
    [gateways, locale],
  );

  const selectedGateway =
    localizedGateways.find((gateway) => gateway.id === selectedId) ?? null;
  const montonioSelected =
    selectedGateway !== null && isMontonioGateway(selectedGateway);

  return (
    <div className="space-y-3">
      {!isLiveCheckoutEnabled() ? (
        <p className="border border-ink/10 bg-surface/50 px-4 py-3 text-xs leading-relaxed text-ink/60">
          {copy.paymentPreview}
        </p>
      ) : null}

      {loading ? (
        <CheckoutPaymentOptionsSkeleton message={copy.paymentLoading} />
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-accent">{error}</p>
          <CheckoutSupportNotice locale={locale} />
        </div>
      ) : localizedGateways.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-ink/60">{copy.paymentEmpty}</p>
          <CheckoutSupportNotice locale={locale} />
        </div>
      ) : (
        <ul className="grid gap-2">
          {localizedGateways.map((gateway) => {
            const selected = selectedId === gateway.id;
            const showMontonioProviders =
              selected &&
              isMontonioGateway(gateway) &&
              gatewayNeedsMontonioSubselection(gateway, montonioOptions);
            const showWooPaymentsPanel =
              selected && isWooPaymentsGateway(gateway.id);
            const expandedPanel = showWooPaymentsPanel
              ? renderWooPaymentsExpandedPanel?.(gateway.id)
              : null;
            const isWooPaymentsCardRow =
              gateway.id === WOO_PAYMENTS_CARD_GATEWAY_ID ||
              gateway.id === WOO_PAYMENTS_GATEWAY_ID;
            const isWooPaymentsWalletRow = Boolean(
              wooPaymentsWalletForGatewayId(gateway.id),
            );
            const wooPaymentsInlineError = isWooPaymentsCardRow
              ? wooPaymentsFormError
              : wooPaymentsExpressError;

            return (
              <li key={gateway.id}>
                <PaymentMethodButton
                  gateway={gateway}
                  selected={selected}
                  onSelect={(gatewayId) => {
                    onSelect(gatewayId);
                    if (!isMontonioGateway(gateway)) {
                      onSelectMontonioOption(null);
                    }
                  }}
                />
                {showWooPaymentsPanel ? (
                  <div
                    className={cn(
                      "relative border border-t-0 border-accent bg-white",
                      isWooPaymentsWalletRow
                        ? "px-4 py-3 sm:px-5"
                        : "px-4 py-5 sm:px-5 sm:py-6",
                    )}
                  >
                    {expandedPanel ? (
                      <div
                        className={cn(
                          (wooPaymentsLoading || wooPaymentsError) &&
                            "pointer-events-none opacity-40",
                        )}
                      >
                        {expandedPanel}
                      </div>
                    ) : wooPaymentsLoading ? (
                      <MorphingSquare message={copy.paymentLoading} size="sm" />
                    ) : null}
                    {wooPaymentsLoading && expandedPanel ? (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                        <MorphingSquare message={copy.paymentLoading} size="sm" />
                      </div>
                    ) : null}
                    {wooPaymentsError ? (
                      <p className="mt-3 text-sm text-accent" role="alert">
                        {wooPaymentsError}
                      </p>
                    ) : null}
                    {wooPaymentsInlineError ? (
                      <p className="mt-3 text-sm text-accent" role="alert">
                        {wooPaymentsInlineError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {showMontonioProviders ? (
                  <MontonioProviderList
                    gateway={gateway}
                    options={montonioOptions}
                    loading={montonioLoading}
                    error={montonioError}
                    configured={montonioConfigured}
                    selectedKey={selectedMontonioKey}
                    onSelect={onSelectMontonioOption}
                    locale={locale}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
