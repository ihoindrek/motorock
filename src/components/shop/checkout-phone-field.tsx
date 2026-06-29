"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useDictionary } from "@/context/locale-context";
import { countryLabel, sortCountryCodes } from "@/lib/shop/countries";
import {
  countryFlagEmoji,
  countryPhonePrefix,
  PHONE_COUNTRY_CODES,
  stripCountryDialCode,
} from "@/lib/shop/phone";
import { cn } from "@/lib/utils";

type CheckoutPhoneFieldProps = {
  country: string;
  onCountryChange: (country: string) => void;
  countries?: string[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  inputClassName: string;
  className?: string;
};

export function CheckoutPhoneField({
  country,
  onCountryChange,
  countries,
  value,
  onChange,
  id,
  name = "phone",
  required,
  inputClassName,
  className,
}: CheckoutPhoneFieldProps) {
  const listId = useId();
  const dict = useDictionary();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const prefix = countryPhonePrefix(country);

  const options = useMemo(() => {
    const codes = countries?.length
      ? [...new Set([...countries, country])]
      : PHONE_COUNTRY_CODES;
    return sortCountryCodes(codes, country);
  }, [countries, country]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative mt-2 flex", className)}>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex h-full min-h-[3.25rem] items-center gap-2 border border-r-0 border-ink/15 bg-ink/[0.04] px-2.5 py-3 transition-colors sm:gap-2.5 sm:px-3",
            open
              ? "border-accent bg-white"
              : "hover:border-ink/30 hover:bg-white",
          )}
        >
          <span
            className="text-[1.35rem] leading-none sm:text-2xl"
            aria-hidden="true"
          >
            {countryFlagEmoji(country)}
          </span>
          {prefix ? (
            <span className="hidden font-body text-sm font-semibold tabular-nums text-ink/65 sm:inline">
              {prefix}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-ink/45 transition-transform duration-200",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={dict.checkout.phoneCountry}
            className="absolute left-0 top-[calc(100%+0.25rem)] z-30 max-h-64 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto border border-ink/15 bg-white shadow-[0_16px_40px_rgb(11_11_11_/_0.12)]"
          >
            {options.map((code) => {
              const selected = code === country;
              const optionPrefix = countryPhonePrefix(code);

              return (
                <li key={code} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onCountryChange(code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "bg-accent/10 text-ink"
                        : "text-ink/80 hover:bg-ink/[0.04]",
                    )}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">
                      {countryFlagEmoji(code)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {countryLabel(code)}
                    </span>
                    {optionPrefix ? (
                      <span className="shrink-0 font-body text-xs font-semibold tabular-nums text-ink/50">
                        {optionPrefix}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <input
        id={id}
        type="tel"
        name={name}
        required={required}
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={(event) =>
          onChange(stripCountryDialCode(country, event.target.value))
        }
        className={cn(inputClassName, "mt-0 min-w-0 flex-1")}
      />
    </div>
  );
}
