import { afterEach, describe, expect, it, vi } from "vitest";
import { resetDebounced, runDebounced } from "@/lib/revalidate/debounce";
import { revalidateFromWooWebhook } from "@/lib/revalidate/handle-woocommerce-revalidate";

vi.mock("@/lib/revalidate/storefront", () => ({
  revalidateStorefront: vi.fn(),
  revalidateWooCatalogTags: vi.fn(),
  revalidateWooProduct: vi.fn(),
}));

import {
  revalidateWooCatalogTags,
  revalidateWooProduct,
} from "@/lib/revalidate/storefront";

describe("revalidateFromWooWebhook", () => {
  afterEach(() => {
    resetDebounced("woocommerce-catalog");
    vi.clearAllMocks();
  });

  it("revalidates only the changed product and debounces catalog tags", () => {
    const payload = JSON.stringify({ id: 42, slug: "goggles-test" });

    const first = revalidateFromWooWebhook("product.updated", payload);
    const second = revalidateFromWooWebhook("product.updated", payload);

    expect(first).toEqual({
      mode: "product",
      slug: "goggles-test",
      debounced: false,
    });
    expect(second).toEqual({
      mode: "product",
      slug: "goggles-test",
      debounced: true,
    });
    expect(revalidateWooProduct).toHaveBeenCalledTimes(2);
    expect(revalidateWooProduct).toHaveBeenCalledWith("goggles-test");
    expect(revalidateWooCatalogTags).toHaveBeenCalledTimes(1);
  });
});

describe("runDebounced", () => {
  afterEach(() => {
    resetDebounced("test-key");
  });

  it("runs at most once within the interval", () => {
    const fn = vi.fn();

    expect(runDebounced("test-key", fn, 60_000)).toBe(true);
    expect(runDebounced("test-key", fn, 60_000)).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
