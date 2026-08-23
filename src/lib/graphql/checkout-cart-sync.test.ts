import { describe, expect, it } from "vitest";
import { canReuseSyncedCheckoutCart } from "@/lib/graphql/checkout";

describe("canReuseSyncedCheckoutCart", () => {
  it("reuses the Woo session when linesKey matches and cart has enough items", () => {
    expect(
      canReuseSyncedCheckoutCart({
        linesKey: "line-a",
        syncedLinesKey: "line-a",
        cartItemCount: 2,
        lineCount: 2,
      }),
    ).toBe(true);
  });

  it("reuses the session even when checkout passes an explicit session token", () => {
    expect(
      canReuseSyncedCheckoutCart({
        linesKey: "line-a",
        syncedLinesKey: "line-a",
        cartItemCount: 3,
        lineCount: 1,
      }),
    ).toBe(true);
  });

  it("rebuilds the cart when linesKey changed", () => {
    expect(
      canReuseSyncedCheckoutCart({
        linesKey: "line-b",
        syncedLinesKey: "line-a",
        cartItemCount: 2,
        lineCount: 2,
      }),
    ).toBe(false);
  });

  it("rebuilds the cart when Woo session has fewer items than checkout lines", () => {
    expect(
      canReuseSyncedCheckoutCart({
        linesKey: "line-a",
        syncedLinesKey: "line-a",
        cartItemCount: 1,
        lineCount: 2,
      }),
    ).toBe(false);
  });
});
