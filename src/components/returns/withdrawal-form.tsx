"use client";

import { useState, type FormEvent } from "react";
import { FormHoneypot } from "@/components/forms/form-honeypot";
import { useDictionary, useLocale } from "@/context/locale-context";
import { submitForm } from "@/lib/forms/submit-form-client";
import {
  shopFieldClassName,
  shopFieldLabelClassName,
} from "@/lib/shop/form-field-styles";

export function WithdrawalForm() {
  const dict = useDictionary();
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!confirmed) {
      setSubmitError(dict.forms.withdrawalConfirmRequired);
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);

    const result = await submitForm({
      type: "withdrawal",
      locale,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      orderNumber: String(data.get("order_number") ?? "") || undefined,
      productDescription: String(data.get("product_description") ?? ""),
      orderDate: String(data.get("order_date") ?? "") || undefined,
      confirmed: true,
      _gotcha: String(data.get("_gotcha") ?? ""),
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error || dict.forms.submitError);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        id="withdrawal-form"
        className="scroll-mt-28 rounded-2xl border border-ink/10 bg-paper p-6 sm:p-8"
      >
        <p className="font-body text-lg font-extrabold uppercase leading-snug tracking-tight text-ink">
          {dict.forms.withdrawalReceived}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          {dict.forms.withdrawalThanks}
        </p>
      </div>
    );
  }

  return (
    <form
      id="withdrawal-form"
      className="scroll-mt-28 space-y-6 rounded-2xl border border-ink/10 bg-paper p-6 sm:space-y-8 sm:p-8"
      onSubmit={handleSubmit}
    >
      <div>
        <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl">
          {dict.forms.withdrawalFormTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          {dict.forms.withdrawalFormIntro}
        </p>
      </div>

      <FormHoneypot />

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="withdrawal-name" className={shopFieldLabelClassName}>
            {dict.forms.name}
          </label>
          <input
            id="withdrawal-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
        <div>
          <label htmlFor="withdrawal-email" className={shopFieldLabelClassName}>
            {dict.forms.email}
          </label>
          <input
            id="withdrawal-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${shopFieldClassName}`}
          />
          <p className="mt-2 text-xs text-ink/50">
            {dict.forms.withdrawalEmailHint}
          </p>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label
            htmlFor="withdrawal-order-number"
            className={shopFieldLabelClassName}
          >
            {dict.forms.withdrawalOrderNumber}{" "}
            <span className="font-normal normal-case tracking-normal text-ink/45">
              ({dict.forms.optional})
            </span>
          </label>
          <input
            id="withdrawal-order-number"
            name="order_number"
            type="text"
            autoComplete="off"
            placeholder={dict.forms.withdrawalOrderNumberPlaceholder}
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
        <div>
          <label htmlFor="withdrawal-order-date" className={shopFieldLabelClassName}>
            {dict.forms.withdrawalOrderDate}{" "}
            <span className="font-normal normal-case tracking-normal text-ink/45">
              ({dict.forms.optional})
            </span>
          </label>
          <input
            id="withdrawal-order-date"
            name="order_date"
            type="date"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="withdrawal-product-description"
          className={shopFieldLabelClassName}
        >
          {dict.forms.withdrawalProduct}
        </label>
        <textarea
          id="withdrawal-product-description"
          name="product_description"
          rows={4}
          required
          placeholder={dict.forms.withdrawalProductPlaceholder}
          className={`mt-2 resize-y ${shopFieldClassName}`}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="confirmed"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 size-4 shrink-0 rounded border-ink/25 text-accent focus:ring-accent"
        />
        <span className="text-sm leading-relaxed text-ink/75">
          {dict.forms.withdrawalConfirmLabel}
        </span>
      </label>

      {submitError ? (
        <p className="text-sm text-accent" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !confirmed}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? dict.forms.submitting : dict.forms.withdrawalSubmit}
      </button>
    </form>
  );
}
