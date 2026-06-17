import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { privacySections } from "@/data/legal-content";

export const metadata = {
  title: "Privacy Policy",
  description: "How Motorock.eu collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentView
      eyebrow="Legal"
      title="Privacy policy"
      description="How we handle your personal data when you shop, enquire, or visit our showroom."
      updated="17 June 2026"
      sections={privacySections}
    />
  );
}
