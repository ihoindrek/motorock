import { describe, expect, it } from "vitest";
import {
  isBenignClientError,
  isChunkLoadError,
} from "@/lib/client/client-error-utils";

describe("client-error-utils", () => {
  it("detects Vercel chunk mismatch errors", () => {
    expect(
      isChunkLoadError(
        "Failed to load chunk /_next/static/chunks/3yyndjt6w1nui.js?dpl=dpl_abc from module 964893",
      ),
    ).toBe(true);
  });

  it("treats insecure storage errors as benign", () => {
    expect(isBenignClientError("The operation is insecure.")).toBe(true);
  });
});
