import { describe, expect, it } from "vitest";
import {
  getInbankCalculatorConfig,
  isInbankCalculatorAmount,
} from "@/lib/montonio/inbank-calculator";

describe("getInbankCalculatorConfig", () => {
  it("uses defaults when env vars are absent", () => {
    const config = getInbankCalculatorConfig();

    expect(config.enabled).toBe(true);
    expect(config.shopUuid).toBe("9a6bebb3-ade9-4968-800c-95ac1f3adecc");
    expect(config.productCode).toBe("hp_epos_montonio_119");
  });
});

describe("isInbankCalculatorAmount", () => {
  it("accepts amounts inside the default hire purchase range", () => {
    expect(isInbankCalculatorAmount(2500)).toBe(true);
    expect(isInbankCalculatorAmount(50)).toBe(false);
    expect(isInbankCalculatorAmount(20_000)).toBe(false);
  });
});
