import { notFound } from "next/navigation";
import { AboutView } from "@/components/about/about-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {
      title: "About",
      description:
        "Motorock.eu — premium motorcycles and riding gear for riders who refuse to blend in.",
    };
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.nav.about,
    description:
      localeParam === "et"
        ? "Motorock.eu — premium mootorrattad ja sõiduvarustus sõitjatele, kes ei taha massi sulanduda."
        : "Motorock.eu — premium motorcycles and riding gear for riders who refuse to blend in.",
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <AboutView locale={localeParam} />;
}
