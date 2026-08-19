import type { CartLine } from "@/context/cart-context";
import type { CheckoutCustomerDetails } from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { PickupPoint } from "@/types/pickup-point";

export type CheckoutOrchestrateInput = {
  sessionToken?: string | null;
  lines: CartLine[];
  linesKey: string;
  customer: CheckoutCustomerDetails;
  selectedShippingRateId: string;
  paymentMethodId: string;
  montonioOption?: MontonioPaymentOption | null;
  needsMontonioProvider?: boolean;
  pickupPoint?: PickupPoint | null;
  locale: "en" | "et";
  displayTotal: number;
  displayShipping: number;
  wooPaymentsStripePaymentMethodId?: string;
  wooPaymentsFraudPreventionToken?: string | null;
};

export type CheckoutOrchestrateSuccess = {
  ok: true;
  redirect: string | null;
  orderNumber: string | null;
  orderDatabaseId: number | null;
  sessionToken: string | null;
  resolvedPaymentMethodId: string;
};

export type CheckoutOrchestrateFailure = {
  ok: false;
  errors: string[];
  code: "PREFLIGHT_FAILED" | "CHECKOUT_FAILED" | "REMINT_FAILED" | "VALIDATION";
};

export type CheckoutOrchestrateResult =
  | CheckoutOrchestrateSuccess
  | CheckoutOrchestrateFailure;

export type CheckoutRemintInput = {
  orderDatabaseId: number;
  orderNumber?: string | null;
  total: number;
  currency?: string;
  locale: "en" | "et";
  country: string;
  montonioOption: MontonioPaymentOption;
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    city: string;
    postcode: string;
    country: string;
  };
  lineItems: Array<{
    name: string;
    finalPrice: number;
    quantity: number;
  }>;
};
