import type { Dictionary } from "@/i18n/dictionaries/en";

type CouponErrorCopy = Dictionary["checkout"];

export function formatCouponError(
  message: string,
  copy: CouponErrorCopy,
): string {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("does not exist") ||
    normalized.includes("not found with the code") ||
    normalized.includes("no coupon found")
  ) {
    return copy.couponNotFound;
  }

  if (
    normalized.includes("already been applied") ||
    normalized.includes("already applied")
  ) {
    return copy.couponAlreadyApplied;
  }

  if (normalized.includes("has not been applied")) {
    return copy.couponNotApplied;
  }

  if (
    normalized.includes("usage limit") ||
    normalized.includes("has been used") ||
    normalized.includes("already been used")
  ) {
    return copy.couponUsageLimitReached;
  }

  if (normalized.includes("expired")) {
    return copy.couponExpired;
  }

  if (
    normalized.includes("not valid for") ||
    normalized.includes("cannot be applied to")
  ) {
    return copy.couponNotValidForCart;
  }

  if (
    normalized.includes("minimum spend") ||
    normalized.includes("minimum order") ||
    normalized.includes("minimum amount")
  ) {
    return copy.couponMinimumSpend;
  }

  return message.trim() || copy.couponApplyFailed;
}
