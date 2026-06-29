"use client";

import { useState, type FormEvent } from "react";
import { useDictionary } from "@/context/locale-context";
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
  const dict = useDictionary();
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
          {dict.forms.requestReceived}
        </p>
        <p className="mt-2 text-sm text-ink/60">{dict.forms.testRideThanks}</p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {bikeLabel ? (
        <div>
          <p className={shopFieldLabelClassName}>{dict.forms.motorcycle}</p>
          <p className="mt-2 font-body text-lg font-extrabold uppercase leading-tight tracking-tight text-ink">
            {bikeLabel}
          </p>
          {initial.color ? (
            <p className="mt-1 text-sm text-ink/55">
              {dict.forms.finish} · {initial.color}
            </p>
          ) : null}
          <input type="hidden" name="bike" value={bikeLabel} />
          {initial.slug ? (
            <input type="hidden" name="slug" value={initial.slug} />
          ) : null}
        </div>
      ) : (
        <div>
          <label htmlFor={`${idPrefix}-bike`} className={shopFieldLabelClassName}>
            {dict.forms.motorcycle}
          </label>
          <input
            id={`${idPrefix}-bike`}
            name="bike"
            type="text"
            required
            placeholder={dict.forms.bikePlaceholder}
            className={`mt-2 ${shopFieldClassName}`}
          />
        </div>
      )}

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
          <label htmlFor={`${idPrefix}-phone`} className={shopFieldLabelClassName}>
            {dict.forms.phone}
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

      <div>
        <label htmlFor={`${idPrefix}-date`} className={shopFieldLabelClassName}>
          {dict.forms.preferredDate}
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
          {dict.forms.notes}
        </label>
        <textarea
          id={`${idPrefix}-message`}
          name="message"
          rows={3}
          placeholder={dict.forms.notesPlaceholder}
          className={`mt-2 resize-y ${shopFieldClassName}`}
        />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent sm:w-auto"
      >
        {dict.forms.sendRequest}
      </button>
    </form>
  );
}
