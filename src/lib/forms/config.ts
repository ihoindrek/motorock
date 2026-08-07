import type { ContactTopic, FormType } from "@/lib/forms/types";

const FORMS_RECIPIENT = "info@motorock.eu";
const FORMS_BCC = "dev@motorock.eu";
const FORMS_FROM = "Motorock <info@motorock.eu>";

export function getFormFromAddress() {
  return process.env.FORM_FROM_EMAIL?.trim() || FORMS_FROM;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isFormDryRun() {
  if (process.env.FORM_DRY_RUN === "true") {
    return true;
  }

  return !isResendConfigured();
}

export function resolveFormRecipient(
  _type: FormType,
  _options?: { topic?: ContactTopic },
) {
  return (
    process.env.FORM_DEFAULT_TO?.trim() ||
    process.env.FORM_ORDERS_TO?.trim() ||
    FORMS_RECIPIENT
  );
}

/** BCC on staff notification emails (not customer confirmations). */
export function getFormBccAddresses(): string[] {
  const raw =
    process.env.FORM_BCC_EMAIL?.trim() ||
    process.env.FORM_BCC?.trim() ||
    FORMS_BCC;

  return raw
    .split(/[,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
