import { describe, expect, it } from "vitest";
import {
  expandMontonioPaymentGateways,
  filterMontonioOptionsForGateway,
  isBankMontonioGateway,
} from "@/components/shop/checkout-payment-options";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";
import type { PaymentGateway } from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";

const bankOptions: MontonioPaymentOption[] = [
  {
    kind: "bank",
    code: "LHVBEE22",
    systemName: "paymentInitiation",
    name: "LHV",
    logoUrl: null,
  },
];

describe("expandMontonioPaymentGateways", () => {
  it("adds synthetic bank gateway when Woo only returns card", () => {
    const gateways: PaymentGateway[] = [
      {
        id: "wc_montonio_card",
        title: "Card",
        description: "",
        icon: null,
      },
    ];

    const expanded = expandMontonioPaymentGateways(gateways, bankOptions, "et");
    const ids = expanded.map((gateway) => gateway.id);

    expect(ids).toContain(MONTONIO_PAYMENT_METHOD_ID);
    expect(ids).toContain("wc_montonio_card");
  });

  it("keeps Woo gateway when wc_montonio_payments is already present", () => {
    const gateways: PaymentGateway[] = [
      {
        id: MONTONIO_PAYMENT_METHOD_ID,
        title: "Pay with your bank",
        description: "",
        icon: null,
      },
    ];

    const expanded = expandMontonioPaymentGateways(gateways, bankOptions, "et");
    expect(expanded.filter((gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID)).toHaveLength(1);
  });
});

describe("filterMontonioOptionsForGateway", () => {
  it("scopes bank options to bank gateway", () => {
    const gateway: PaymentGateway = {
      id: MONTONIO_PAYMENT_METHOD_ID,
      title: "Pay with your bank",
      description: "",
      icon: null,
    };

    expect(filterMontonioOptionsForGateway(gateway, bankOptions)).toEqual(bankOptions);
    expect(isBankMontonioGateway(gateway)).toBe(true);
  });
});
