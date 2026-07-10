import type { FormSubmitPayload, WithdrawalFormPayload } from "@/lib/forms/types";

const TOPIC_LABELS = {
  en: {
    motorcycles: "Motorcycles & test rides",
    equipment: "Equipment & sizing",
    orders: "Orders & delivery",
    other: "Something else",
  },
  et: {
    motorcycles: "Mootorrattad ja proovisõidud",
    equipment: "Varustus ja suurused",
    orders: "Tellimused ja tarne",
    other: "Midagi muud",
  },
} as const;

const INTENT_LABELS = {
  en: {
    enquire: "Enquiry",
    question: "Question",
    availability: "Availability",
  },
  et: {
    enquire: "Päring",
    question: "Küsimus",
    availability: "Saadavus",
  },
} as const;

const TYPE_LABELS = {
  en: {
    contact: "Contact",
    "test-ride": "Test ride",
    enquiry: "Motorcycle enquiry",
    withdrawal: "Order withdrawal",
  },
  et: {
    contact: "Kontakt",
    "test-ride": "Proovisõit",
    enquiry: "Mootorratta päring",
    withdrawal: "Tellimusest taganemine",
  },
} as const;

function localeTag(locale: FormSubmitPayload["locale"]) {
  return locale.toUpperCase();
}

export function buildFormEmail(payload: FormSubmitPayload) {
  const typeLabel = TYPE_LABELS[payload.locale][payload.type];
  const subjectParts = [`[${localeTag(payload.locale)}] ${typeLabel}`, payload.name];

  if (payload.type === "contact") {
    subjectParts.splice(1, 0, TOPIC_LABELS[payload.locale][payload.topic]);
  } else if (payload.type === "enquiry") {
    subjectParts.splice(1, 0, INTENT_LABELS[payload.locale][payload.intent]);
    subjectParts.push(payload.bike);
  } else if (payload.type === "withdrawal" && payload.orderNumber) {
    subjectParts.push(payload.orderNumber);
  } else if (payload.type === "test-ride" && payload.bike) {
    subjectParts.push(payload.bike);
  }

  const lines = [
    `Type: ${typeLabel}`,
    `Locale: ${payload.locale}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
  ];

  if (payload.type === "contact") {
    lines.push(`Topic: ${TOPIC_LABELS[payload.locale][payload.topic]}`);
    lines.push("", "Message:", payload.message);
  }

  if (payload.type === "test-ride") {
    lines.push(`Phone: ${payload.phone}`);
    lines.push(`Preferred date: ${payload.preferredDate}`);
    if (payload.bike) lines.push(`Motorcycle: ${payload.bike}`);
    if (payload.slug) lines.push(`Slug: ${payload.slug}`);
    if (payload.message) {
      lines.push("", "Notes:", payload.message);
    }
  }

  if (payload.type === "enquiry") {
    lines.push(`Intent: ${INTENT_LABELS[payload.locale][payload.intent]}`);
    lines.push(`Motorcycle: ${payload.bike}`);
    lines.push(`Slug: ${payload.slug}`);
    if (payload.phone) lines.push(`Phone: ${payload.phone}`);
    lines.push("", "Message:", payload.message);
  }

  if (payload.type === "withdrawal") {
    if (payload.orderNumber) lines.push(`Order number: ${payload.orderNumber}`);
    if (payload.orderDate) lines.push(`Order / delivery date: ${payload.orderDate}`);
    lines.push("", "Product / order:", payload.productDescription);
    lines.push("", "Consumer confirmed withdrawal: yes");
  }

  return {
    subject: subjectParts.join(" — "),
    text: lines.join("\n"),
  };
}

function formatTimestamp(locale: WithdrawalFormPayload["locale"]) {
  return new Intl.DateTimeFormat(locale === "et" ? "et-EE" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Tallinn",
  }).format(new Date());
}

export function buildWithdrawalConfirmationEmail(payload: WithdrawalFormPayload) {
  const submittedAt = formatTimestamp(payload.locale);

  if (payload.locale === "et") {
    const lines = [
      `Tere, ${payload.name},`,
      "",
      "Oleme kätte saanud teie tellimusest taganemise avalduse.",
      "",
      "Avalduse sisu:",
      `Nimi: ${payload.name}`,
      `E-post: ${payload.email}`,
    ];

    if (payload.orderNumber) lines.push(`Tellimuse number: ${payload.orderNumber}`);
    if (payload.orderDate) lines.push(`Tellimuse / kättesaamise kuupäev: ${payload.orderDate}`);
    lines.push(`Toode / tellimus: ${payload.productDescription}`);
    lines.push("", `Esitatud: ${submittedAt}`);
    lines.push(
      "",
      "Vastame teile peagi eraldi kinnitusega. Toote tagastamise juhised leiate aadressilt motorock.eu/returns.",
      "",
      "Motorock.eu",
    );

    return {
      subject: "Taganemisavalduse kättesaamine — Motorock.eu",
      text: lines.join("\n"),
    };
  }

  const lines = [
    `Hello ${payload.name},`,
    "",
    "We have received your order withdrawal request.",
    "",
    "Your submission:",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
  ];

  if (payload.orderNumber) lines.push(`Order number: ${payload.orderNumber}`);
  if (payload.orderDate) lines.push(`Order / delivery date: ${payload.orderDate}`);
  lines.push(`Product / order: ${payload.productDescription}`);
  lines.push("", `Submitted: ${submittedAt}`);
  lines.push(
    "",
    "We will reply shortly with a separate confirmation. Return instructions are at motorock.eu/returns.",
    "",
    "Motorock.eu",
  );

  return {
    subject: "Withdrawal request received — Motorock.eu",
    text: lines.join("\n"),
  };
}
