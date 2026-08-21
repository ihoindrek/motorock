import { describe, expect, it } from "vitest";
import {
  formatCheckoutStockError,
  isCheckoutStockError,
  normalizeCheckoutErrorMessage,
  shouldReportCheckoutError,
} from "@/lib/checkout/checkout-user-errors";

describe("checkout user errors", () => {
  it("detects Woo stock errors", () => {
    expect(
      isCheckoutStockError(
        'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available).',
      ),
    ).toBe(true);
  });

  it("deduplicates repeated Woo stock sentences", () => {
    const duplicated =
      'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available). We apologize for any inconvenience caused.' +
      'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available). We apologize for any inconvenience caused.';

    expect(normalizeCheckoutErrorMessage(duplicated)).toBe(
      'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available). We apologize for any inconvenience caused.',
    );
  });

  it("formats a localized stock message with the product name", () => {
    expect(
      formatCheckoutStockError(
        'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available).',
        "et",
      ),
    ).toContain("GARAGE GLOVES BLUE - XS");
  });

  it("does not send Slack alerts for stock errors", () => {
    expect(
      shouldReportCheckoutError(
        'Sorry, we do not have enough "GARAGE GLOVES BLUE - XS" in stock to fulfill your order (0 available).',
      ),
    ).toBe(false);
    expect(shouldReportCheckoutError("Checkout payment could not be started.")).toBe(
      true,
    );
  });
});
