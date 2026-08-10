import { isValidCheckoutPhone } from "@/lib/shop/phone";
import type { PickupPoint } from "@/types/pickup-point";

export type DeliveryField =
  | "email"
  | "country"
  | "shipping"
  | "pickupPoint"
  | "address"
  | "city"
  | "postcode"
  | "firstName"
  | "lastName"
  | "phone";

export type DeliveryChecklistId =
  | "email"
  | "country"
  | "shipping"
  | "pickupPoint"
  | "address"
  | "name"
  | "phone";

export type DeliveryValidationMessages = {
  required: string;
  emailInvalid: string;
  checklistEmail: string;
  checklistCountry: string;
  checklistShipping: string;
  checklistPickup: string;
  checklistAddress: string;
  checklistName: string;
  checklistPhone: string;
};

export type DeliveryValidationInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
  address1: string;
  city: string;
  postcode: string;
  shippingCountry: string;
  selectedRateId: string | null;
  needsAddress: boolean;
  needsPickupPoint: boolean;
  pickupPoint: PickupPoint | null;
};

export type DeliveryChecklistItem = {
  id: DeliveryChecklistId;
  label: string;
  complete: boolean;
};

export type DeliveryValidationResult = {
  ready: boolean;
  fieldErrors: Partial<Record<DeliveryField, string>>;
  checklist: DeliveryChecklistItem[];
  firstInvalidField: DeliveryField | null;
};

const FIELD_SELECTORS: Record<DeliveryField, string> = {
  email: '#checkout-form input[name="email"]',
  country: '#checkout-form select[name="country"]',
  shipping: "#checkout-shipping-options",
  pickupPoint: "#checkout-pickup-point",
  address: '#checkout-form input[name="address-line1"]',
  city: '#checkout-form input[name="address-level2"]',
  postcode: '#checkout-form input[name="postal-code"]',
  firstName: '#checkout-form input[name="given-name"]',
  lastName: '#checkout-form input[name="family-name"]',
  phone: '#checkout-form input[name="phone"]',
};

function isValidEmail(value: string) {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function pushError(
  fieldErrors: Partial<Record<DeliveryField, string>>,
  field: DeliveryField,
  message: string,
) {
  if (!fieldErrors[field]) {
    fieldErrors[field] = message;
  }
}

export function validateDelivery(
  input: DeliveryValidationInput,
  messages: DeliveryValidationMessages,
): DeliveryValidationResult {
  const fieldErrors: Partial<Record<DeliveryField, string>> = {};

  const emailComplete = isValidEmail(input.email);
  if (!input.email.trim()) {
    pushError(fieldErrors, "email", messages.required);
  } else if (!emailComplete) {
    pushError(fieldErrors, "email", messages.emailInvalid);
  }

  const countryComplete = Boolean(input.shippingCountry.trim());
  if (!countryComplete) {
    pushError(fieldErrors, "country", messages.required);
  }

  const shippingComplete = Boolean(input.selectedRateId);
  if (!shippingComplete) {
    pushError(fieldErrors, "shipping", messages.required);
  }

  const pickupComplete =
    !input.needsPickupPoint || Boolean(input.pickupPoint?.id || input.pickupPoint?.name);
  if (input.needsPickupPoint && !pickupComplete) {
    pushError(fieldErrors, "pickupPoint", messages.required);
  }

  const addressComplete =
    !input.needsAddress ||
    Boolean(
      input.address1.trim() && input.city.trim() && input.postcode.trim(),
    );
  if (input.needsAddress) {
    if (!input.address1.trim()) {
      pushError(fieldErrors, "address", messages.required);
    }
    if (!input.city.trim()) {
      pushError(fieldErrors, "city", messages.required);
    }
    if (!input.postcode.trim()) {
      pushError(fieldErrors, "postcode", messages.required);
    }
  }

  const nameComplete = Boolean(input.firstName.trim() && input.lastName.trim());
  if (!input.firstName.trim()) {
    pushError(fieldErrors, "firstName", messages.required);
  }
  if (!input.lastName.trim()) {
    pushError(fieldErrors, "lastName", messages.required);
  }

  const phoneComplete = isValidCheckoutPhone(input.phoneCountry, input.phone);
  if (!phoneComplete) {
    pushError(fieldErrors, "phone", messages.required);
  }

  const checklist: DeliveryChecklistItem[] = [
    { id: "email", label: messages.checklistEmail, complete: emailComplete },
    {
      id: "country",
      label: messages.checklistCountry,
      complete: countryComplete,
    },
    {
      id: "shipping",
      label: messages.checklistShipping,
      complete: shippingComplete,
    },
  ];

  if (input.needsPickupPoint) {
    checklist.push({
      id: "pickupPoint",
      label: messages.checklistPickup,
      complete: pickupComplete,
    });
  }

  if (input.needsAddress) {
    checklist.push({
      id: "address",
      label: messages.checklistAddress,
      complete: addressComplete,
    });
  }

  checklist.push(
    { id: "name", label: messages.checklistName, complete: nameComplete },
    { id: "phone", label: messages.checklistPhone, complete: phoneComplete },
  );

  const fieldOrder: DeliveryField[] = [
    "email",
    "country",
    "shipping",
    "pickupPoint",
    "address",
    "city",
    "postcode",
    "firstName",
    "lastName",
    "phone",
  ];
  const firstInvalidField =
    fieldOrder.find((field) => fieldErrors[field]) ?? null;

  return {
    ready: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    checklist,
    firstInvalidField,
  };
}

export function focusDeliveryField(field: DeliveryField | null) {
  if (!field || typeof document === "undefined") {
    return;
  }

  const node = document.querySelector<HTMLElement>(FIELD_SELECTORS[field]);
  if (!node) {
    return;
  }

  node.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in node && typeof node.focus === "function") {
    node.focus({ preventScroll: true });
  }
}
