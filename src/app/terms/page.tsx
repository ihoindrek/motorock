import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { termsSections } from "@/data/legal-content";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping at Motorock.eu.",
};

export default function TermsPage() {
  return (
    <LegalDocumentView
      eyebrow="Legal"
      title="Terms & conditions"
      description="The rules that apply when you buy from Motorock.eu or use our services."
      updated="17 June 2026"
      sections={termsSections}
    />
  );
}
