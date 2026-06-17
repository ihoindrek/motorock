"use client";

import { useState, type FormEvent } from "react";
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

const messagePlaceholders: Record<MotorcycleEnquiryIntent, string> = {
  enquire:
    "Interested in ordering or arranging a viewing — tell us what you need…",
  question: "What's on your mind about this bike?",
  availability: "Let us know what you're looking for and we'll follow up…",
};

export function MotorcycleEnquiryForm({
  bikeName,
  brand,
  color,
  slug,
  intent,
  idPrefix = "motorcycle-enquiry",
}: MotorcycleEnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const displayName = `${brand} ${bikeName}`.trim();

  if (submitted) {
    return (
      <div>
        <p className="font-display text-lg font-extrabold uppercase leading-snug tracking-tight text-ink">
          Message received
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Thanks — we&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div>
        <p className={shopFieldLabelClassName}>Motorcycle</p>
        <p className="mt-2 font-display text-lg font-extrabold uppercase leading-tight tracking-tight text-ink">
          {displayName}
        </p>
        {color ? (
          <p className="mt-1 text-sm text-ink/55">Finish · {color}</p>
        ) : null}
        <input type="hidden" name="bike" value={displayName} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="subject" value="motorcycles" />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className={shopFieldLabelClassName}>
            Name
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
            Email
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
          Phone <span className="font-normal normal-case text-ink/35">(optional)</span>
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
          Message
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
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent sm:w-auto"
      >
        Send message →
      </button>
    </form>
  );
}
