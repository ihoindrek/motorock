"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useDictionary } from "@/context/locale-context";
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
  const [submitted, setSubmitted] = useState(false);

  const messagePlaceholders = useMemo(
    () => ({
      enquire: dict.forms.enquirePlaceholder,
      question: dict.forms.questionPlaceholder,
      availability: dict.forms.availabilityPlaceholder,
    }),
    [dict.forms],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const displayName = `${brand} ${bikeName}`.trim();

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
    <form className="space-y-8" onSubmit={handleSubmit}>
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

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent sm:w-auto"
      >
        {dict.forms.sendMessage}
      </button>
    </form>
  );
}
