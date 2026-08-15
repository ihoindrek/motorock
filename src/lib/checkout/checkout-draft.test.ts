import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCheckoutDraft,
  clearCheckoutPaymentRedirect,
  hasRecentCheckoutPaymentRedirect,
  markCheckoutPaymentRedirect,
  readCheckoutDraft,
  writeCheckoutDraft,
} from "@/lib/checkout/checkout-draft";

describe("checkout draft", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    clearCheckoutDraft();
    vi.unstubAllGlobals();
  });

  it("persists and reads checkout state", () => {
    writeCheckoutDraft({
      country: "SE",
      selectedRateId: "flat_rate:5",
      email: "buyer@example.com",
      firstName: "Anna",
      lastName: "Svensson",
      phone: "701234567",
      phoneCountry: "SE",
      address1: "",
      city: "",
      postcode: "",
      paymentId: "ppcp-gateway",
      montonioOptionKey: null,
      pickupPoint: null,
      termsAccepted: true,
    });

    expect(readCheckoutDraft()).toMatchObject({
      country: "SE",
      selectedRateId: "flat_rate:5",
      email: "buyer@example.com",
      paymentId: "ppcp-gateway",
    });
  });

  it("ignores drafts without a country", () => {
    writeCheckoutDraft({
      country: "  ",
      selectedRateId: null,
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      phoneCountry: "",
      address1: "",
      city: "",
      postcode: "",
      paymentId: null,
      montonioOptionKey: null,
      pickupPoint: null,
      termsAccepted: false,
    });

    expect(readCheckoutDraft()).toBeNull();
  });

  it("tracks recent payment redirects", () => {
    expect(hasRecentCheckoutPaymentRedirect()).toBe(false);

    markCheckoutPaymentRedirect();
    expect(hasRecentCheckoutPaymentRedirect()).toBe(true);

    clearCheckoutPaymentRedirect();
    expect(hasRecentCheckoutPaymentRedirect()).toBe(false);
  });
});
