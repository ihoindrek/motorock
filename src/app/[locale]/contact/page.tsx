import { notFound } from "next/navigation";
import { ContactView } from "@/components/contact/contact-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {
      title: "Contact",
      description:
        "Contact Motorock.eu — showroom, test rides, orders, and riding gear advice.",
    };
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.nav.contact,
    description:
      localeParam === "et"
        ? "Võta Motorock.eu-ga ühendust — showroom, proovisõidud, tellimused ja varustuse nõuanded."
        : "Contact Motorock.eu — showroom, test rides, orders, and riding gear advice.",
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <ContactView locale={localeParam} />;
}
