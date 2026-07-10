import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/shop/category";

describe("formatPrice", () => {
  it("shows cents for fractional prices", () => {
    expect(formatPrice(9.9, "et")).toMatch(/9,90/);
    expect(formatPrice(9.9, "en")).toMatch(/9\.90/);
  });

  it("hides cents for whole euro amounts", () => {
    expect(formatPrice(120, "et")).toMatch(/120/);
    expect(formatPrice(120, "et")).not.toMatch(/,00/);
  });
});
