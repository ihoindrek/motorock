import { MontonioPaymentReturnFallback } from "@/components/shop/montonio-payment-return-fallback";
import { resolveMontonioReturnTarget } from "@/lib/checkout/montonio-return";

export const dynamic = "force-dynamic";

type PaymentReturnPageProps = {
  searchParams: Promise<{
    "order-token"?: string;
    "error-message"?: string;
    gateway?: string;
    locale?: string;
  }>;
};

export default async function MontonioPaymentReturnPage({
  searchParams,
}: PaymentReturnPageProps) {
  const query = await searchParams;
  const target = await resolveMontonioReturnTarget({
    orderToken: query["order-token"],
    errorMessage: query["error-message"],
    gateway: query.gateway,
    locale: query.locale,
  });

  return (
    <MontonioPaymentReturnFallback
      continueHref={target}
      locale={query.locale === "en" ? "en" : "et"}
    />
  );
}
