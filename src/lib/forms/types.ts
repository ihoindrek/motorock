import type { Locale } from "@/i18n/config";

export type FormType = "contact" | "test-ride" | "enquiry" | "withdrawal";

export type ContactTopic = "motorcycles" | "equipment" | "orders" | "other";

export type EnquiryIntent = "enquire" | "question" | "availability";

type FormBase = {
  locale: Locale;
  name: string;
  email: string;
  /** Honeypot — must be empty. */
  _gotcha?: string;
};

export type ContactFormPayload = FormBase & {
  type: "contact";
  topic: ContactTopic;
  message: string;
};

export type TestRideFormPayload = FormBase & {
  type: "test-ride";
  phone: string;
  preferredDate: string;
  message?: string;
  bike?: string;
  slug?: string;
};

export type EnquiryFormPayload = FormBase & {
  type: "enquiry";
  phone?: string;
  message: string;
  intent: EnquiryIntent;
  bike: string;
  slug: string;
};

export type WithdrawalFormPayload = FormBase & {
  type: "withdrawal";
  orderNumber?: string;
  productDescription: string;
  orderDate?: string;
  /** Must be true — consumer confirms withdrawal intent. */
  confirmed: true;
};

export type FormSubmitPayload =
  | ContactFormPayload
  | TestRideFormPayload
  | EnquiryFormPayload
  | WithdrawalFormPayload;

export type FormSubmitResult =
  | { ok: true; dryRun?: boolean }
  | { ok: false; error: string };
