"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FormHoneypot } from "@/components/forms/form-honeypot";
import { useDictionary, useLocale } from "@/context/locale-context";
import { submitForm } from "@/lib/forms/submit-form-client";
import {
  shopFieldClassName,
  shopFieldLabelClassName,
} from "@/lib/shop/form-field-styles";

export type MotorcycleEnquiryIntent = "enquire" | "question" | "availability";

type MotorcycleEnquiryFormProps = {
  bikeName: string;
  brand: string;
  color?: string;
  slug: string;
  intent: MotorcycleEnquiryIntent;
  idPrefix?: string;
};

export function MotorcycleEnquiryForm({
  bikeName,
  brand,
  color,
  slug,
  intent,
  idPrefix = "motorcycle-enquiry",
}: MotorcycleEnquiryFormProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const displayName = `${brand} ${bikeName}`.trim();

  const messagePlaceholders = useMemo(
    () => ({
      enquire: dict.forms.enquirePlaceholder,
      question: dict.forms.questionPlaceholder,
      availability: dict.forms.availabilityPlaceholder,
    }),
    [dict.forms],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);

    const result = await submitForm({
      type: "enquiry",
      locale,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      message: String(data.get("message") ?? ""),
      intent,
      bike: String(data.get("bike") ?? displayName),
      slug: String(data.get("slug") ?? slug),
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
      <div>
        <p className="font-body text-lg font-extrabold uppercase leading-snug tracking-tight text-ink">
          {dict.forms.messageReceived}
        </p>
        <p className="mt-2 text-sm text-ink/60">{dict.forms.thanksReply}</p>
      </div>
    );
  }

  return (
    <form className="relative space-y-8" onSubmit={handleSubmit}>
      <FormHoneypot />
      <div>
        <p className={shopFieldLabelClassName}>{dict.forms.motorcycle}</p>
        <p className="mt-2 font-body text-lg font-extrabold uppercase leading-tight tracking-tight text-ink">
          {displayName}
        </p>
        {color ? (
          <p className="mt-1 text-sm text-ink/55">
            {dict.forms.finish} · {color}
          </p>
        ) : null}
        <input type="hidden" name="bike" value={displayName} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="subject" value="motorcycles" />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className={shopFieldLabelClassName}>
            {dict.forms.name}
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className={shopFieldLabelClassName}>
            {dict.forms.email}
          </label>
          <input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-phone`} className={shopFieldLabelClassName}>
          {dict.forms.phone}{" "}
          <span className="font-normal normal-case text-ink/35">
            ({dict.forms.phoneOptional})
          </span>
        </label>
        <input
          id={`${idPrefix}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          className={`mt-2 ${shopFieldClassName}`}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-message`} className={shopFieldLabelClassName}>
          {dict.forms.message}
        </label>
        <textarea
          id={`${idPrefix}-message`}
          name="message"
          required
          rows={4}
          placeholder={messagePlaceholders[intent]}
          className={`mt-2 resize-y ${shopFieldClassName}`}
        />
      </div>

      {submitError ? (
        <p className="text-sm text-accent" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? dict.forms.submitting : dict.forms.sendMessage}
      </button>
    </form>
  );
}
