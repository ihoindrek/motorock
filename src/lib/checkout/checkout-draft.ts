import type { PickupPoint } from "@/types/pickup-point";

const CHECKOUT_DRAFT_KEY = "motorock-checkout-draft";
const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export type CheckoutDraft = {
  version: 1;
  savedAt: number;
  country: string;
  selectedRateId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
  address1: string;
  city: string;
  postcode: string;
  paymentId: string | null;
  montonioOptionKey: string | null;
  pickupPoint: PickupPoint | null;
  termsAccepted: boolean;
};

export type CheckoutDraftInput = Omit<CheckoutDraft, "version" | "savedAt">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPickupPoint(value: unknown): value is PickupPoint {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.address === "string" &&
    typeof value.city === "string" &&
    typeof value.postcode === "string" &&
    typeof value.carrier === "string"
  );
}

function parseCheckoutDraft(value: unknown): CheckoutDraft | null {
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }

  const savedAt = typeof value.savedAt === "number" ? value.savedAt : 0;
  if (!savedAt || Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
    return null;
  }

  const country = typeof value.country === "string" ? value.country.trim().toUpperCase() : "";
  if (!country) {
    return null;
  }

  return {
    version: 1,
    savedAt,
    country,
    selectedRateId:
      typeof value.selectedRateId === "string" ? value.selectedRateId : null,
    email: typeof value.email === "string" ? value.email : "",
    firstName: typeof value.firstName === "string" ? value.firstName : "",
    lastName: typeof value.lastName === "string" ? value.lastName : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    phoneCountry:
      typeof value.phoneCountry === "string" ? value.phoneCountry : country,
    address1: typeof value.address1 === "string" ? value.address1 : "",
    city: typeof value.city === "string" ? value.city : "",
    postcode: typeof value.postcode === "string" ? value.postcode : "",
    paymentId: typeof value.paymentId === "string" ? value.paymentId : null,
    montonioOptionKey:
      typeof value.montonioOptionKey === "string" ? value.montonioOptionKey : null,
    pickupPoint: isPickupPoint(value.pickupPoint) ? value.pickupPoint : null,
    termsAccepted: value.termsAccepted === true,
  };
}

function getSessionStorage() {
  if (typeof globalThis.sessionStorage === "undefined") {
    return null;
  }

  return globalThis.sessionStorage;
}

export function readCheckoutDraft(): CheckoutDraft | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    return parseCheckoutDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(input: CheckoutDraftInput) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const country = input.country.trim().toUpperCase();
  if (!country) {
    return;
  }

  const draft: CheckoutDraft = {
    version: 1,
    savedAt: Date.now(),
    ...input,
    country,
  };

  storage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearCheckoutDraft() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(CHECKOUT_DRAFT_KEY);
}

const PAYMENT_REDIRECT_KEY = "motorock-checkout-payment-redirect";
const PAYMENT_REDIRECT_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export function markCheckoutPaymentRedirect() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PAYMENT_REDIRECT_KEY, String(Date.now()));
}

export function hasRecentCheckoutPaymentRedirect() {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  const raw = storage.getItem(PAYMENT_REDIRECT_KEY);
  if (!raw) {
    return false;
  }

  const savedAt = Number(raw);
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > PAYMENT_REDIRECT_MAX_AGE_MS) {
    storage.removeItem(PAYMENT_REDIRECT_KEY);
    return false;
  }

  return true;
}

export function clearCheckoutPaymentRedirect() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(PAYMENT_REDIRECT_KEY);
}
