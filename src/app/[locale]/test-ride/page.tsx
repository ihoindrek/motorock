import { TestRideView } from "@/components/shop/test-ride-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.pages.testRideTitle,
    description: dict.pages.testRideDescription,
  };
}

export const revalidate = 300;

// Prefill values are read from the query string client-side so the page
// stays static (reading searchParams on the server would force dynamic
// rendering and disable ISR).
export default function TestRidePage() {
  return <TestRideView />;
}
