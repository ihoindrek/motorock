const CHECKOUT_STOCK_ERROR =
  /do not have enough|not enough.*in stock|out of stock|0 available/i;

export function isCheckoutStockError(message: string | null | undefined) {
  return Boolean(message && CHECKOUT_STOCK_ERROR.test(message));
}

/** Woo sometimes returns the same stock sentence twice in one message. */
export function normalizeCheckoutErrorMessage(message: string) {
  const trimmed = message.trim();
  if (trimmed.length < 40) {
    return trimmed;
  }

  const midpoint = Math.floor(trimmed.length / 2);
  if (trimmed.slice(0, midpoint) === trimmed.slice(midpoint)) {
    return trimmed.slice(0, midpoint).trim();
  }

  const duplicateSentence = "Checkout payment could not be started.";
  const duplicateIndex = trimmed.indexOf(
    duplicateSentence,
    duplicateSentence.length,
  );
  if (duplicateIndex > 0) {
    return trimmed.slice(0, duplicateIndex).trim();
  }

  return trimmed;
}

export function formatCheckoutStockError(
  message: string,
  locale: "en" | "et" = "en",
) {
  const normalized = normalizeCheckoutErrorMessage(message);
  const productMatch = normalized.match(/"([^"]+)"/);

  if (productMatch?.[1]) {
    return locale === "et"
      ? `Kahjuks pole toodet „${productMatch[1]}“ piisavalt laos. Vali teine suurus või eemalda see ostukorvist.`
      : `Sorry, "${productMatch[1]}" is not available in the quantity you requested. Choose another size or remove it from your cart.`;
  }

  return locale === "et"
    ? "Üks või mitu toodet pole piisavalt laos. Kontrolli suurust ja kogust ostukorvis."
    : "One or more items are out of stock. Check sizes and quantities in your cart.";
}

export function shouldReportCheckoutError(message: string) {
  return !isCheckoutStockError(message);
}
