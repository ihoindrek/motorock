import type { Appearance } from "@stripe/stripe-js";

const INK = "#0b0b0b";
const ACCENT = "#ff6813";
const INK_15 = "rgb(11 11 11 / 0.15)";
const INK_25 = "rgb(11 11 11 / 0.25)";
const INK_50 = "rgb(11 11 11 / 0.5)";

/** Stripe Elements skin aligned with Motorock checkout fields. */
export function buildStripeCheckoutAppearance(): Appearance {
  return {
    theme: "stripe",
    variables: {
      colorPrimary: ACCENT,
      colorBackground: "#ffffff",
      colorText: INK,
      colorTextSecondary: INK_50,
      colorTextPlaceholder: "rgb(11 11 11 / 0.35)",
      colorDanger: "#c8102e",
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      fontSizeBase: "16px",
      fontWeightNormal: "400",
      fontWeightMedium: "600",
      fontWeightBold: "700",
      spacingUnit: "4px",
      borderRadius: "0px",
      focusBoxShadow: "none",
      focusOutline: "none",
    },
    rules: {
      ".Input": {
        border: `1px solid ${INK_15}`,
        backgroundColor: "#ffffff",
        padding: "12px 16px",
        boxShadow: "none",
        transition: "border-color 150ms ease",
      },
      ".Input:hover": {
        borderColor: INK_25,
      },
      ".Input:focus": {
        borderColor: ACCENT,
        boxShadow: "none",
      },
      ".Input--invalid": {
        borderColor: "#c8102e",
        boxShadow: "none",
      },
      ".Label": {
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: INK_50,
        marginBottom: "8px",
      },
      ".Tab": {
        border: `1px solid ${INK_15}`,
        backgroundColor: "#ffffff",
        boxShadow: "none",
        padding: "10px 16px",
      },
      ".Tab:hover": {
        borderColor: INK_25,
        backgroundColor: "#ffffff",
      },
      ".Tab--selected": {
        borderColor: ACCENT,
        backgroundColor: "#ffffff",
        boxShadow: "none",
      },
      ".TabIcon": {
        display: "none",
      },
      ".TabIcon--selected": {
        display: "none",
      },
      ".TabLabel": {
        fontSize: "12px",
        fontWeight: "600",
      },
      ".Block": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "0",
      },
      ".AccordionItem": {
        border: `1px solid ${INK_15}`,
        backgroundColor: "#ffffff",
        padding: "16px",
        boxShadow: "none",
      },
      ".PickerItem": {
        border: `1px solid ${INK_15}`,
        backgroundColor: "#ffffff",
      },
      ".PickerItem--selected": {
        borderColor: ACCENT,
        backgroundColor: "#ffffff",
      },
    },
  };
}
