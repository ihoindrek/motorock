"use client";

import { useState, type FormEvent } from "react";
import {
  shopFieldClassName,
  shopFieldLabelClassName,
} from "@/lib/shop/form-field-styles";

export type TestRideInitialValues = {
  slug?: string;
  bike?: string;
  brand?: string;
  color?: string;
};

type TestRideFormProps = {
  initial: TestRideInitialValues;
  idPrefix?: string;
};

export function TestRideForm({ initial, idPrefix = "test-ride" }: TestRideFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const bikeLabel =
    initial.bike && initial.brand
      ? `${initial.brand} ${initial.bike}`
      : initial.bike ?? "";

  if (submitted) {
    return (
      <div>
        <p className="font-body text-lg font-extrabold uppercase leading-snug tracking-tight text-ink">
          Request received
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Thanks — we&apos;ll be in touch to confirm your test ride.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {bikeLabel ? (
        <div>
          <p className={shopFieldLabelClassName}>Motorcycle</p>
          <p className="mt-2 font-body text-lg font-extrabold uppercase leading-tight tracking-tight text-ink">
            {bikeLabel}
          </p>
          {initial.color ? (
            <p className="mt-1 text-sm text-ink/55">Finish · {initial.color}</p>
          ) : null}
          <input type="hidden" name="bike" value={bikeLabel} />
          {initial.slug ? (
            <input type="hidden" name="slug" value={initial.slug} />
          ) : null}
        </div>
      ) : (
        <div>
          <label htmlFor={`${idPrefix}-bike`} className={shopFieldLabelClassName}>
            Motorcycle
          </label>
          <input
            id={`${idPrefix}-bike`}
            name="bike"
            type="text"
            required
            placeholder="Which model interests you?"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
      )}

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
          <label htmlFor={`${idPrefix}-phone`} className={shopFieldLabelClassName}>
            Phone
          </label>
          <input
            id={`${idPrefix}-phone`}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
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

      <div>
        <label htmlFor={`${idPrefix}-date`} className={shopFieldLabelClassName}>
          Preferred date
        </label>
        <input
          id={`${idPrefix}-date`}
          name="preferred_date"
          type="date"
          required
          className={`mt-2 ${shopFieldClassName}`}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-message`} className={shopFieldLabelClassName}>
          Notes
        </label>
        <textarea
          id={`${idPrefix}-message`}
          name="message"
          rows={3}
          placeholder="Licence type, experience, questions…"
          className={`mt-2 resize-y ${shopFieldClassName}`}
        />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent sm:w-auto"
      >
        Send request →
      </button>
    </form>
  );
}
