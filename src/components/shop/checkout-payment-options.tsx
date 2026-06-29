"use client";

import { useState, type ReactNode } from "react";
import { MorphLoading } from "@/components/ui/morph-loading";
import { resolvePaymentMethodVisual } from "@/lib/shop/payment-method-visual";
import type { PaymentGateway } from "@/lib/graphql/checkout";
import { isLiveCheckoutEnabled } from "@/lib/checkout-mode";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import {
  montonioOptionKey,
  montonioOptionLabel,
} from "@/types/montonio-payment";
import { cn } from "@/lib/utils";

function isMontonioGateway(gateway: PaymentGateway) {
  return gateway.id.toLowerCase().includes("montonio");
}

export function filterMontonioOptionsForGateway(
  gateway: PaymentGateway,
  options: MontonioPaymentOption[],
) {
  const haystack = `${gateway.id} ${gateway.title}`.toLowerCase();

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
    haystack.includes("purchase")
  ) {
    return options.filter((option) => option.kind === "hirePurchase");
  }

  if (
    haystack.includes("bank") ||
    haystack.includes("pang") ||
    haystack.includes("pay with your")
  ) {
    return options.filter(
      (option) =>
        option.kind === "bank" && option.systemName === "paymentInitiation",
    );
  }

  return options;
}

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

  if (visual.kind === "logo" && !logoFailed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          className,
        )}
      >
        <img
          src={visual.src}
          alt={visual.alt}
          width={50}
          height={33}
          className="h-7 w-auto max-w-full object-contain"
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
      : gateway.title
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

function formatBankDisplayName(name: string) {
  return name
    .replace(/\s+Estonia$/i, "")
    .replace(/\s+Eesti$/i, "")
    .replace(/\s+Bank$/i, "")
    .trim();
}

function BankLinkButton({
  option,
  selected,
  onSelect,
}: {
  option: MontonioPaymentOption;
  selected: boolean;
  onSelect: (option: MontonioPaymentOption) => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const label = formatBankDisplayName(option.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[4.75rem] w-full flex-col items-center justify-center gap-2.5 border bg-white px-3 py-3.5 transition-all duration-200 sm:min-h-[5rem]",
        selected
          ? "border-accent ring-2 ring-accent/20 shadow-sm"
          : "border-ink/12 hover:-translate-y-px hover:border-ink/25 hover:shadow-[0_8px_20px_rgb(11_11_11_/_0.06)]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-full items-center justify-center sm:h-10",
          selected ? "opacity-100" : "opacity-90 group-hover:opacity-100",
        )}
      >
        {option.logoUrl && !logoFailed ? (
          <img
            src={option.logoUrl}
            alt=""
            width={88}
            height={32}
            className="max-h-9 w-auto max-w-[5.75rem] object-contain sm:max-h-10 sm:max-w-[6.25rem]"
            loading="lazy"
            decoding="async"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="font-body text-xs font-bold uppercase tracking-wide text-ink/55">
            {label.slice(0, 4)}
          </span>
        )}
      </span>
      <span
        className={cn(
          "line-clamp-1 text-center text-[11px] font-medium leading-none sm:text-xs",
          selected ? "text-ink" : "text-ink/60 group-hover:text-ink/80",
        )}
      >
        {label}
      </span>
      {selected ? (
        <span
          className="absolute right-2 top-2 size-1.5 rounded-full bg-accent"
          aria-hidden="true"
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
          className="min-h-[4.75rem] animate-pulse border border-ink/10 bg-white sm:min-h-[5rem]"
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
  locale: "en" | "et";
}) {
  const scopedOptions = filterMontonioOptionsForGateway(gateway, options);
  const copy =
    locale === "et"
      ? {
          loading: "Laen makseviise…",
          chooseBank: "Pangalink",
          card: "Kaardimakse",
          financing: "Järelmaks ja maksa hiljem",
          blik: "BLIK",
          notConfigured:
            "Montonio API võtmed puuduvad serveris — makseviise ei lae.",
          empty: "Selle riigi jaoks makseviise ei leitud.",
        }
      : {
          loading: "Loading payment methods…",
          chooseBank: "Bank link",
          card: "Card payment",
          financing: "Pay later & hire purchase",
          blik: "BLIK",
          notConfigured:
            "Montonio API keys are missing on the server — payment methods cannot load.",
          empty: "No payment methods found for this country.",
        };

  if (loading) {
    return (
      <div className="border border-t-0 border-ink/10 bg-paper/40 px-3 py-4 sm:px-4">
        <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
          {copy.chooseBank}
        </p>
        <BankLinksSkeleton />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-accent">{error}</p>;
  }

  if (!configured) {
    return <p className="text-sm text-ink/55">{copy.notConfigured}</p>;
  }

  if (scopedOptions.length === 0) {
    return <p className="text-sm text-ink/55">{copy.empty}</p>;
  }

  const banks = scopedOptions.filter(
    (option) =>
      option.kind === "bank" && option.systemName === "paymentInitiation",
  );
  const card = scopedOptions.filter((option) => option.kind === "card");
  const financing = scopedOptions.filter(
    (option) => option.kind === "bnpl" || option.kind === "hirePurchase",
  );
  const blik = scopedOptions.filter((option) => option.kind === "blik");
  const isSelected = (option: MontonioPaymentOption) =>
    selectedKey === montonioOptionKey(option);

  return (
    <div className="space-y-4 border border-t-0 border-ink/10 bg-paper/40 px-3 py-4 sm:px-4">
      {banks.length > 0 ? (
        <MontonioSection title={copy.chooseBank}>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {banks.map((option) => (
              <li key={montonioOptionKey(option)} className="min-w-0">
                <BankLinkButton
                  option={option}
                  selected={isSelected(option)}
                  onSelect={onSelect}
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
        <MontonioSection
          title={copy.financing}
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
      ) : null}

      {blik.length > 0 ? (
        <MontonioSection
          title={copy.blik}
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

  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-white shadow-sm"
          : "border-ink/15 bg-paper hover:border-ink/30",
      )}
    >
      {option.logoUrl && !logoFailed ? (
        <img
          src={option.logoUrl}
          alt=""
          width={50}
          height={33}
          className="h-7 w-auto max-w-[4rem] object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-md border border-ink/10 bg-white font-body text-[10px] font-bold uppercase text-ink/55">
          {displayName.slice(0, 3)}
        </span>
      )}
      <span className="text-sm font-semibold text-ink">{displayName}</span>
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
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-white shadow-sm"
          : "border-ink/15 bg-paper hover:border-ink/30",
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
    </button>
  );
}

export function CheckoutPaymentOptionsSkeleton({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-ink/10 bg-white px-6 py-8">
      <MorphLoading size="sm" />
      <p className="text-center text-xs font-medium text-ink/50">{message}</p>
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
  waitingForDelivery,
  error,
  locale,
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
  waitingForDelivery?: boolean;
  error: string | null;
  locale: "en" | "et";
}) {
  const copy =
    locale === "et"
      ? {
          loading: "Laen makseviise…",
          waiting: "Makseviisid ilmuvad pärast tarneviisi valimist.",
          empty: "Makseviise ei leitud.",
          preview:
            "Testrežiim — makseviisid laetakse WooCommerce'ist. Tellimust ei looda ega makset ei võeta.",
        }
      : {
          loading: "Loading payment methods…",
          waiting: "Payment methods appear after you choose delivery.",
          empty: "No payment methods found.",
          preview:
            "Test mode — payment methods load from WooCommerce. No order is created and no payment is taken.",
        };

  const selectedGateway =
    gateways.find((gateway) => gateway.id === selectedId) ?? null;
  const montonioSelected =
    selectedGateway !== null && isMontonioGateway(selectedGateway);

  return (
    <div className="space-y-3">
      {!isLiveCheckoutEnabled() ? (
        <p className="border border-ink/10 bg-surface/50 px-4 py-3 text-xs leading-relaxed text-ink/60">
          {copy.preview}
        </p>
      ) : null}

      {waitingForDelivery ? (
        <p className="text-sm text-ink/50">{copy.waiting}</p>
      ) : loading ? (
        <CheckoutPaymentOptionsSkeleton message={copy.loading} />
      ) : error ? (
        <p className="text-sm text-accent">{error}</p>
      ) : gateways.length === 0 ? (
        <p className="text-sm text-ink/60">{copy.empty}</p>
      ) : (
        <ul className="grid gap-2">
          {gateways.map((gateway) => {
            const selected = selectedId === gateway.id;
            const showMontonioProviders =
              selected && isMontonioGateway(gateway);

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
