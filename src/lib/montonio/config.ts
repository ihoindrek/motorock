export type MontonioEnvironment = "sandbox" | "production";

/** Server-only — never import from client components. */
export function getMontonioConfig() {
  const accessKey = process.env.MONTONIO_ACCESS_KEY;
  const secretKey = process.env.MONTONIO_SECRET_KEY;
  const environment =
    process.env.MONTONIO_ENV === "production" ? "production" : "sandbox";

  return {
    accessKey,
    secretKey,
    environment,
    isConfigured: Boolean(accessKey && secretKey),
    paymentsApiBase:
      environment === "production"
        ? "https://stargate.montonio.com/api"
        : "https://sandbox-stargate.montonio.com/api",
    shippingApiBase:
      environment === "production"
        ? "https://shipping.montonio.com/api/v2"
        : "https://sandbox-shipping.montonio.com/api/v2",
  };
}
