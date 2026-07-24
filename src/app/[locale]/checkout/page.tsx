import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  // Preserve query params — external flows land here with meaningful state
  // (?payment_error= from cancelled payments, ?restore= from reminder emails).
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (typeof entry === "string") {
        query.append(key, entry);
      }
    }
  }

  const suffix = query.size > 0 ? `?${query}` : "";
  redirect(`${localizedHref(localeParam, "/cart")}${suffix}`);
}
