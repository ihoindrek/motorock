import type { LegalSection } from "@/components/legal/legal-document-view";
import { SHIPPING_COST, SHIPPING_THRESHOLD } from "@/lib/shop/cart-totals";
import { SHOWROOM } from "@/data/showroom";

const companyName = "Motorock OÜ";
const contactEmail = "hello@motorock.eu";

export const privacySections: readonly LegalSection[] = [
  {
    id: "controller",
    title: "Who we are",
    paragraphs: [
      `${companyName} operates motorock.eu and is the data controller for personal data collected through this website.`,
      `For privacy-related requests, contact us at ${contactEmail}.`,
    ],
  },
  {
    id: "data-we-collect",
    title: "What we collect",
    paragraphs: ["We may process the following categories of personal data:"],
    bullets: [
      "Contact details (name, email, phone) when you enquire, book a test ride, or place an order",
      "Delivery and billing address for purchases",
      "Order history, cart contents, and payment status",
      "Technical data such as IP address, browser type, and cookies required for site functionality",
      "Communications you send us by email or contact form",
    ],
  },
  {
    id: "why",
    title: "Why we use your data",
    paragraphs: ["We process personal data to:"],
    bullets: [
      "Fulfil orders and provide customer support",
      "Arrange showroom visits and test rides",
      "Calculate shipping and process payments through our payment partners",
      "Improve the website and prevent fraud",
      "Comply with accounting and legal obligations",
    ],
  },
  {
    id: "legal-basis",
    title: "Legal basis",
    paragraphs: [
      "We rely on contract performance for order fulfilment, legitimate interests for customer service and site security, and legal obligation where required by Estonian or EU law. Marketing communications are sent only with your consent where applicable.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing with third parties",
    paragraphs: [
      "We share data only when necessary to operate the shop, for example with payment providers (such as Montonio), couriers, hosting providers, and our WooCommerce backend. These partners process data under their own terms and applicable data protection requirements.",
    ],
  },
  {
    id: "retention",
    title: "Retention",
    paragraphs: [
      "We keep order and accounting records as required by law. Marketing and enquiry data is retained only as long as needed for the purpose collected or until you ask us to delete it, subject to legal retention duties.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    paragraphs: ["Under GDPR you may have the right to:"],
    bullets: [
      "Access, rectify, or erase your personal data",
      "Restrict or object to certain processing",
      "Data portability where applicable",
      "Lodge a complaint with the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon)",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    paragraphs: [
      "We use essential cookies for cart and checkout functionality. Analytics or marketing cookies, if introduced later, will be described in an updated version of this policy.",
    ],
  },
];

export const termsSections: readonly LegalSection[] = [
  {
    id: "general",
    title: "General",
    paragraphs: [
      `These terms apply to purchases and use of motorock.eu operated by ${companyName}. By placing an order you confirm that you are at least 18 years old and that the information you provide is accurate.`,
    ],
  },
  {
    id: "products",
    title: "Products & pricing",
    paragraphs: [
      "Product images are indicative. Specifications may change according to the manufacturer. Prices are shown in euros and include VAT where stated at checkout. We reserve the right to correct obvious pricing errors before accepting an order.",
    ],
  },
  {
    id: "orders",
    title: "Orders & contract",
    paragraphs: [
      "An order becomes binding when we confirm it by email and/or when payment is successfully received, depending on the payment method. We may refuse or cancel an order if an item is unavailable, if fraud is suspected, or if required by law.",
    ],
  },
  {
    id: "payment",
    title: "Payment",
    paragraphs: [
      "We accept payment methods shown at checkout, including bank links and instalment options offered by our payment partners. Final financing terms are set by the provider at the time of application.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    paragraphs: [
      "Delivery options and costs are shown at checkout. Risk passes to you when the goods are handed to the carrier or collected from our showroom, unless mandatory consumer law provides otherwise.",
    ],
  },
  {
    id: "returns",
    title: "Returns & exchanges",
    paragraphs: [
      "For riding equipment, we offer free exchange or returns within 14 days for unused items in original condition, unless a different statutory right applies. Motorcycles and made-to-order items may have separate arrangements — contact us before purchase if unsure.",
    ],
  },
  {
    id: "warranty",
    title: "Warranty",
    paragraphs: [
      "Manufacturer warranty applies where provided. Statutory consumer rights under Estonian and EU law are not limited by these terms.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    paragraphs: [
      "We are liable for direct loss caused by our breach where permitted by law. We are not liable for indirect loss, except where mandatory law requires otherwise.",
    ],
  },
  {
    id: "law",
    title: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of Estonia. Disputes are resolved in Estonian courts unless mandatory consumer protection rules require otherwise.",
    ],
  },
];

export const shippingSections: readonly LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    paragraphs: [
      `We ship riding gear and accessories across Estonia and selected international destinations. Shipping options and prices are calculated at checkout based on your basket and delivery address.`,
    ],
  },
  {
    id: "estonia",
    title: "Estonia",
    paragraphs: [
      `Orders over €${SHIPPING_THRESHOLD} qualify for free standard shipping within Estonia where offered at checkout. Below that threshold, standard shipping is €${SHIPPING_COST.toFixed(2).replace(".", ",")} unless a different rate is shown.`,
    ],
    bullets: [
      "Parcel locker and courier options appear at checkout",
      "Showroom pickup is available at our Tallinn showroom when offered for your order",
      "Typical handling time is 1–3 business days before dispatch",
    ],
  },
  {
    id: "international",
    title: "International",
    paragraphs: [
      "International courier delivery is available to selected countries. Customs duties, import VAT, and local handling fees may apply outside the EU and are the recipient's responsibility unless stated otherwise at checkout.",
    ],
  },
  {
    id: "motorcycles",
    title: "Motorcycles",
    paragraphs: [
      "Motorcycles are collected from our showroom or delivered by separate arrangement. Contact us for registration, transport, and lead times before ordering.",
    ],
  },
  {
    id: "pickup",
    title: "Showroom pickup",
    paragraphs: [
      `Collect from ${SHOWROOM.name}, ${SHOWROOM.addressLine}, ${SHOWROOM.city}. We will email you when your order is ready.`,
    ],
  },
  {
    id: "tracking",
    title: "Tracking & issues",
    paragraphs: [
      `If your parcel is delayed or arrives damaged, contact ${contactEmail} with your order number. We will help you trace the shipment or open a claim with the carrier.`,
    ],
  },
];
