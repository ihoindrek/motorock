import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/montonio/decode-payment-token", () => ({
  decodeMontonioPaymentToken: vi.fn(),
}));

vi.mock("@/lib/woocommerce/fetch-order-return-context", () => ({
  fetchOrderReturnContext: vi.fn(),
}));

vi.mock("@/lib/monitoring/observability", () => ({
  captureStorefrontError: vi.fn(),
  logStorefrontEvent: vi.fn(),
}));

import { decodeMontonioPaymentToken } from "@/lib/montonio/decode-payment-token";
import { resolveMontonioReturnTarget } from "@/lib/checkout/montonio-return";
import { getStorefrontUrl } from "@/lib/storefront/url";

describe("resolveMontonioReturnTarget", () => {
  const storefront = getStorefrontUrl();

  beforeEach(() => {
    vi.mocked(decodeMontonioPaymentToken).mockReset();
  });

  it("sends cancelled card payments back to cart instead of thank-you", async () => {
    vi.mocked(decodeMontonioPaymentToken).mockReturnValue({
      merchantReference: "44199",
      paymentStatus: "PENDING",
    });

    await expect(
      resolveMontonioReturnTarget({
        orderToken: "token",
        locale: "en",
        gateway: "wc_montonio_card",
      }),
    ).resolves.toContain(`${storefront}/en/cart?payment_error=`);
  });

  it("normalizes storefront checkout redirects without locale", async () => {
    vi.mocked(decodeMontonioPaymentToken).mockReturnValue({
      merchantReference: "44199",
      paymentStatus: "PAID",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      headers: {
        get: () =>
          `${storefront}/checkout?payment_error=Payment%20cancelled`,
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveMontonioReturnTarget({
        orderToken: "token",
        locale: "en",
        gateway: "wc_montonio_card",
      }),
    ).resolves.toContain(`${storefront}/en/cart?payment_error=`);

    vi.unstubAllGlobals();
  });
});
