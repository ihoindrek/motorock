import { describe, expect, it } from "vitest";
import {
  expandMontonioPaymentGateways,
  filterMontonioOptionsForGateway,
  isBankMontonioGateway,
  resolveVisiblePaymentGateways,
} from "@/components/shop/checkout-payment-options";
import {
  filterSupportedPaymentGateways,
  MONTONIO_PAYMENT_METHOD_ID,
} from "@/lib/graphql/checkout";
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

  it("orders bank link before card before hire purchase before BNPL", () => {
    const gateways: PaymentGateway[] = [
      {
        id: "wc_montonio_bnpl",
        title: "BNPL",
        description: "",
        icon: null,
      },
      {
        id: "wc_montonio_card",
        title: "Card",
        description: "",
        icon: null,
      },
      {
        id: MONTONIO_PAYMENT_METHOD_ID,
        title: "Bank",
        description: "",
        icon: null,
      },
      {
        id: "wc_montonio_hire_purchase",
        title: "HP",
        description: "",
        icon: null,
      },
    ];

    const hirePurchaseOption: MontonioPaymentOption = {
      kind: "hirePurchase",
      code: "hirePurchase",
      systemName: "hirePurchase",
      name: "Hire purchase",
      logoUrl: null,
    };
    const bnplOption: MontonioPaymentOption = {
      kind: "bnpl",
      code: "bnpl",
      systemName: "bnpl",
      name: "BNPL",
      logoUrl: null,
    };
    const cardOption: MontonioPaymentOption = {
      kind: "card",
      code: "cardPayments",
      systemName: "cardPayments",
      name: "Card",
      logoUrl: null,
    };

    const expanded = expandMontonioPaymentGateways(
      gateways,
      [...bankOptions, cardOption, hirePurchaseOption, bnplOption],
      "et",
    );

    expect(expanded.map((gateway) => gateway.id)).toEqual([
      MONTONIO_PAYMENT_METHOD_ID,
      "wc_montonio_card",
      "wc_montonio_hire_purchase",
      "wc_montonio_bnpl",
    ]);
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

  it("scopes MobilePay option to the MobilePay gateway only", () => {
    const mobilePayOption: MontonioPaymentOption = {
      kind: "mobilePay",
      code: "mobilePay",
      systemName: "mobilePay",
      name: "MobilePay",
      logoUrl: null,
    };
    const options = [...bankOptions, mobilePayOption];

    const mobilePayGateway: PaymentGateway = {
      id: "wc_montonio_mobilepay",
      title: "Montonio MobilePay",
      description: "",
      icon: null,
    };
    const bankGateway: PaymentGateway = {
      id: MONTONIO_PAYMENT_METHOD_ID,
      title: "Pay with your bank",
      description: "",
      icon: null,
    };

    expect(filterMontonioOptionsForGateway(mobilePayGateway, options)).toEqual([
      mobilePayOption,
    ]);
    expect(filterMontonioOptionsForGateway(bankGateway, options)).toEqual(bankOptions);
  });

  it("does not attach Montonio options to non-Montonio gateways like PayPal", () => {
    const cardOption: MontonioPaymentOption = {
      kind: "card",
      code: "card",
      systemName: "cardPayments",
      name: "Card",
      logoUrl: null,
    };
    const paypalGateway: PaymentGateway = {
      id: "ppcp-gateway",
      title: "PayPal",
      description: "",
      icon: null,
    };

    expect(filterMontonioOptionsForGateway(paypalGateway, [cardOption])).toEqual([]);
  });
});

describe("filterSupportedPaymentGateways", () => {
  it("keeps redirect-capable PayPal but drops JS-SDK-only PPCP gateways", () => {
    const gateways: PaymentGateway[] = [
      { id: "ppcp-axo-gateway", title: "Debit & Credit Cards", icon: null },
      { id: "ppcp-credit-card-gateway", title: "Debit & Credit Cards", icon: null },
      { id: "ppcp-applepay", title: "Apple Pay", icon: null },
      { id: "ppcp-googlepay", title: "Google Pay", icon: null },
      { id: "ppcp-gateway", title: "PayPal", icon: null },
      { id: MONTONIO_PAYMENT_METHOD_ID, title: "Pay with your bank", icon: null },
    ];

    expect(filterSupportedPaymentGateways(gateways).map((gateway) => gateway.id)).toEqual([
      "ppcp-gateway",
      MONTONIO_PAYMENT_METHOD_ID,
    ]);
  });
});

describe("resolveVisiblePaymentGateways", () => {
  it("keeps Woo bank link in live checkout without gating on Montonio options", () => {
    const gateways: PaymentGateway[] = [
      { id: "ppcp-gateway", title: "PayPal", description: "", icon: null },
      { id: MONTONIO_PAYMENT_METHOD_ID, title: "Pay with your bank", description: "", icon: null },
    ];

    const live = resolveVisiblePaymentGateways(gateways, [], "et", true);
    expect(live.map((gateway) => gateway.id)).toEqual([
      "ppcp-gateway",
      MONTONIO_PAYMENT_METHOD_ID,
    ]);
  });

  it("hides synthetic BNPL/hire-purchase rows in live checkout", () => {
    const gateways: PaymentGateway[] = [
      { id: "ppcp-gateway", title: "PayPal", description: "", icon: null },
      { id: MONTONIO_PAYMENT_METHOD_ID, title: "Pay with your bank", description: "", icon: null },
    ];
    const options: MontonioPaymentOption[] = [
      ...bankOptions,
      {
        kind: "bnpl",
        code: "bnpl",
        systemName: "bnpl",
        name: "Pay later",
        logoUrl: null,
      },
      {
        kind: "hirePurchase",
        code: "hirePurchase",
        systemName: "hirePurchase",
        name: "Hire purchase",
        logoUrl: null,
      },
    ];

    const live = resolveVisiblePaymentGateways(gateways, options, "et", true);
    expect(live.map((gateway) => gateway.id)).toEqual([
      "ppcp-gateway",
      MONTONIO_PAYMENT_METHOD_ID,
    ]);

    const preview = resolveVisiblePaymentGateways(gateways, options, "et", false);
    expect(preview.map((gateway) => gateway.id)).toEqual(
      expect.arrayContaining(["wc_montonio_bnpl", "wc_montonio_hire_purchase"]),
    );
  });
});
