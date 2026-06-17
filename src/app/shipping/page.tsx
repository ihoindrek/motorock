import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { shippingSections } from "@/data/legal-content";

export const metadata = {
  title: "Shipping & Delivery",
  description: "Shipping options, delivery times, and pickup at Motorock.eu.",
};

export default function ShippingPage() {
  return (
    <LegalDocumentView
      eyebrow="Legal"
      title="Shipping & delivery"
      description="How we deliver riding gear, accessories, and motorcycles across Estonia and beyond."
      updated="17 June 2026"
      sections={shippingSections}
    />
  );
}
