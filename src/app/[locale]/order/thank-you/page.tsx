import { notFound } from "next/navigation";
import { OrderThankYouView } from "@/components/shop/order-thank-you-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type ThankYouPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string; key?: string }>;
};

export async function generateMetadata({ params }: ThankYouPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.pages.orderThankYouTitle,
    description: dict.pages.orderThankYouDescription,
    robots: { index: false, follow: false },
  };
}

export default async function OrderThankYouPage({
  params,
  searchParams,
}: ThankYouPageProps) {
  const { locale: localeParam } = await params;
  const query = await searchParams;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const orderId = query.order?.trim();
  const orderKey = query.key?.trim();

  if (!orderId) {
    notFound();
  }

  return (
    <OrderThankYouView
      locale={localeParam}
      orderId={orderId}
      orderKey={orderKey}
    />
  );
}
