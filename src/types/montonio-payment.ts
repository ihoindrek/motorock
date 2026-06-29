export type MontonioPaymentOptionKind =
  | "bank"
  | "card"
  | "bnpl"
  | "hirePurchase"
  | "blik";

export type MontonioPaymentOption = {
  code: string;
  name: string;
  logoUrl: string | null;
  systemName: string;
  kind: MontonioPaymentOptionKind;
};

export function montonioOptionKey(option: MontonioPaymentOption) {
  return `${option.systemName}:${option.code}`;
}

export function montonioOptionLabel(
  option: MontonioPaymentOption,
  locale: "en" | "et",
) {
  if (locale === "et") {
    switch (option.systemName) {
      case "cardPayments":
        return "Kaardimakse";
      case "bnpl":
        return "Osta nüüd, maksa hiljem";
      case "hirePurchase":
        return "Järelmaks";
      case "blik":
        return "BLIK";
      default:
        return option.name;
    }
  }

  switch (option.systemName) {
    case "cardPayments":
      return "Card payment";
    case "bnpl":
      return "Buy now, pay later";
    case "hirePurchase":
      return "Hire purchase";
    case "blik":
      return "BLIK";
    default:
      return option.name;
  }
}
