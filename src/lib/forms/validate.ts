import { isLocale } from "@/i18n/config";
import type {
  ContactFormPayload,
  EnquiryFormPayload,
  FormSubmitPayload,
  TestRideFormPayload,
  WithdrawalFormPayload,
} from "@/lib/forms/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function readOptionalString(value: unknown, maxLength: number) {
  if (value == null || value === "") {
    return undefined;
  }

  return readString(value, maxLength) ?? undefined;
}

function baseFields(body: Record<string, unknown>) {
  const locale = body.locale;
  if (typeof locale !== "string" || !isLocale(locale)) {
    return null;
  }

  const name = readString(body.name, 120);
  const email = readString(body.email, 254);

  if (!name || !email || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  if (readString(body._gotcha, 200)) {
    return null;
  }

  return { locale, name, email };
}

export function parseFormSubmitPayload(
  body: unknown,
): FormSubmitPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const type = record.type;

  if (type === "contact") {
    const base = baseFields(record);
    const topic = record.topic;
    const message = readString(record.message, 5000);

    if (
      !base ||
      !message ||
      !["motorcycles", "equipment", "orders", "other"].includes(String(topic))
    ) {
      return null;
    }

    return {
      type: "contact",
      ...base,
      topic: topic as ContactFormPayload["topic"],
      message,
    };
  }

  if (type === "test-ride") {
    const base = baseFields(record);
    const phone = readString(record.phone, 40);
    const preferredDate = readString(record.preferredDate, 32);

    if (!base || !phone || !preferredDate) {
      return null;
    }

    return {
      type: "test-ride",
      ...base,
      phone,
      preferredDate,
      message: readOptionalString(record.message, 3000),
      bike: readOptionalString(record.bike, 200),
      slug: readOptionalString(record.slug, 200),
    };
  }

  if (type === "withdrawal") {
    const base = baseFields(record);
    const productDescription = readString(record.productDescription, 2000);

    if (!base || !productDescription || record.confirmed !== true) {
      return null;
    }

    return {
      type: "withdrawal",
      ...base,
      productDescription,
      orderNumber: readOptionalString(record.orderNumber, 80),
      orderDate: readOptionalString(record.orderDate, 32),
      confirmed: true,
    } satisfies WithdrawalFormPayload;
  }

  if (type === "enquiry") {
    const base = baseFields(record);
    const message = readString(record.message, 5000);
    const bike = readString(record.bike, 200);
    const slug = readString(record.slug, 200);
    const intent = record.intent;

    if (
      !base ||
      !message ||
      !bike ||
      !slug ||
      !["enquire", "question", "availability"].includes(String(intent))
    ) {
      return null;
    }

    return {
      type: "enquiry",
      ...base,
      message,
      bike,
      slug,
      intent: intent as EnquiryFormPayload["intent"],
      phone: readOptionalString(record.phone, 40),
    };
  }

  return null;
}
