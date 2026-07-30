import { describe, expect, it } from "vitest";
import { isFinancingAvailable } from "@/data/financing";

describe("isFinancingAvailable", () => {
  it("allows hire purchase calculator for Estonia", () => {
    expect(isFinancingAvailable("EE")).toBe(true);
    expect(isFinancingAvailable("ee")).toBe(true);
  });

  it("blocks hire purchase calculator for other countries", () => {
    expect(isFinancingAvailable("FI")).toBe(false);
    expect(isFinancingAvailable("LV")).toBe(false);
    expect(isFinancingAvailable("DE")).toBe(false);
  });

  it("blocks when country is unknown", () => {
    expect(isFinancingAvailable(null)).toBe(false);
    expect(isFinancingAvailable(undefined)).toBe(false);
    expect(isFinancingAvailable("")).toBe(false);
  });
});
