"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { isFinancingAvailable } from "@/data/financing";
import {
  getInbankCalculatorConfig,
  INBANK_CALCULATOR_COMPACT_HEIGHT_PX,
  INBANK_CALCULATOR_COMPACT_WIDTH_PX,
  INBANK_LOGO_URL,
  inbankCalculatorLang,
  isInbankCalculatorAmount,
  loadInbankCalculatorWidget,
  openInbankCalculatorModal,
  resolveInbankMonthlyPaymentLine,
  waitForInbankCalculatorPreview,
  waitForInbankCalculatorTrigger,
  type InbankCalculatorPreview,
} from "@/lib/montonio/inbank-calculator";
import { cn } from "@/lib/utils";

export type MontonioFinancingCalculatorHandle = {
  openModal: () => void;
};

type MontonioFinancingCalculatorProps = {
  amount: number;
  countryCode?: string;
  eyebrow?: string;
  calculateLabel: string;
  className?: string;
};

export const MontonioFinancingCalculator = forwardRef<
  MontonioFinancingCalculatorHandle,
  MontonioFinancingCalculatorProps
>(function MontonioFinancingCalculator(
  { amount, countryCode, eyebrow, calculateLabel, className = "" },
  ref,
) {
  const locale = useLocale();
  const dict = useDictionary();
  const reactId = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<InbankCalculatorPreview | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const config = getInbankCalculatorConfig();

  const enabled =
    config.enabled &&
    isFinancingAvailable(countryCode) &&
    isInbankCalculatorAmount(amount);

  const ready = widgetReady;

  const logoUrl = preview?.logoUrl ?? INBANK_LOGO_URL;
  const paymentLine = resolveInbankMonthlyPaymentLine(
    preview?.paymentText,
    locale,
    dict.financing.perMonth,
  );

  useImperativeHandle(ref, () => ({
    openModal: () => {
      if (hostRef.current) {
        openInbankCalculatorModal(hostRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!enabled || !hostRef.current) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const containerId = reactId;
    const node = hostRef.current;
    node.id = containerId;
    node.replaceChildren();
    setPreview(null);
    setWidgetReady(false);
    setFailed(false);

    loadInbankCalculatorWidget()
      .then(async (calculator) => {
        if (cancelled || !hostRef.current) {
          return;
        }

        calculator.init(containerId, {
          layout: "default",
          variant: "calculator-indivy-plan",
          shop_uuid: config.shopUuid,
          product_code: config.productCode,
          amount,
          template: config.template,
          mode: "white",
          lang: inbankCalculatorLang(locale),
          region: config.region,
        });

        const trigger = await waitForInbankCalculatorTrigger(hostRef.current);
        if (!cancelled) {
          setWidgetReady(Boolean(trigger));
        }

        const parsed = await waitForInbankCalculatorPreview(
          hostRef.current,
          amount,
        );

        if (!cancelled && (parsed?.paymentText || parsed?.logoUrl)) {
          setPreview(parsed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    amount,
    config.productCode,
    config.region,
    config.shopUuid,
    config.template,
    enabled,
    locale,
    reactId,
  ]);

  if (!enabled || failed) {
    return null;
  }

  return (
    <>
      <div className={cn("min-w-0", className)}>
        <div className="flex items-center gap-x-1.5">
          {eyebrow ? (
            <span className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              {eyebrow}
            </span>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Inbank"
            className="h-3 w-auto max-w-[3rem] shrink-0 object-contain opacity-70"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="font-body text-sm font-bold leading-none text-ink">
            {paymentLine}
          </span>
          <button
            type="button"
            onClick={() => {
              if (hostRef.current) {
                openInbankCalculatorModal(hostRef.current);
              }
            }}
            disabled={!ready}
            aria-busy={!ready}
            className="inline-flex items-center border border-ink/15 px-2.5 py-1 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-40"
          >
            {calculateLabel}
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 -z-50 overflow-hidden opacity-0"
        style={{
          width: INBANK_CALCULATOR_COMPACT_WIDTH_PX,
          height: INBANK_CALCULATOR_COMPACT_HEIGHT_PX,
        }}
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </>
  );
});
