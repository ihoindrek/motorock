import { notFound } from "next/navigation";
import { CartCheckoutView } from "@/components/shop/cart-checkout-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type CartPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CartPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.pages.cartTitle,
    description: dict.pages.cartDescription,
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <CartCheckoutView />;
}
