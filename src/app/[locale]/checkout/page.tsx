import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  redirect(localizedHref(localeParam, "/cart"));
}
