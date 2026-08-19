import { NextResponse } from "next/server";
import { z } from "zod";
import { orchestrateCheckout } from "@/lib/checkout/orchestrate-checkout";
import type { CheckoutOrchestrateInput } from "@/lib/checkout/orchestrate-checkout.types";
import { remintMontonioCheckoutPayment } from "@/lib/checkout/remint-montonio-checkout";

const pickupCarrierSchema = z.enum([
  "omniva",
  "smartposti",
  "dpd",
  "gls",
  "alzabox",
  "novapost",
]);

const cartLineSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  price: z.number(),
  image: z.string(),
  brand: z.string().optional(),
  type: z.enum(["equipment", "motorcycle"]).optional(),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
  color: z.string().optional(),
  productId: z.number().optional(),
  variationId: z.number().optional(),
  metaCatalogProductId: z.number().optional(),
  metaCatalogVariationId: z.number().optional(),
});

const montonioOptionSchema = z.object({
  code: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  systemName: z.string(),
  kind: z.enum([
    "bank",
    "card",
    "mobilePay",
    "bnpl",
    "hirePurchase",
    "blik",
  ]),
});

const customerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  country: z.string().length(2),
  postcode: z.string(),
  city: z.string(),
  address1: z.string(),
});

const remintBodySchema = z.object({
  phase: z.literal("remint"),
  orderDatabaseId: z.number().int().positive(),
  orderNumber: z.string().nullable().optional(),
  total: z.number().positive(),
  currency: z.string().optional(),
  locale: z.enum(["en", "et"]),
  country: z.string().length(2),
  montonioOption: montonioOptionSchema,
  billing: customerSchema,
  shipping: customerSchema,
  lineItems: z
    .array(
      z.object({
        name: z.string().min(1),
        finalPrice: z.number(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

const fullBodySchema = z.object({
  phase: z.literal("full").optional(),
  sessionToken: z.string().nullable().optional(),
  lines: z.array(cartLineSchema).min(1),
  linesKey: z.string().min(1),
  customer: customerSchema,
  selectedShippingRateId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  montonioOption: montonioOptionSchema.nullable().optional(),
  needsMontonioProvider: z.boolean().optional(),
  pickupPoint: z
    .object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
      city: z.string(),
      postcode: z.string(),
      carrier: pickupCarrierSchema,
      montonioItemId: z.string().optional(),
      carrierAssignedId: z.string().optional(),
    })
    .nullable()
    .optional(),
  locale: z.enum(["en", "et"]),
  displayTotal: z.number().positive(),
  displayShipping: z.number().nonnegative(),
});

function readSessionToken(request: Request, bodySession?: string | null) {
  return (
    bodySession ??
    request.headers.get("x-woo-session") ??
    request.headers.get("woocommerce-session")?.replace(/^Session\s+/i, "") ??
    null
  );
}

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", errors: ["Invalid JSON body"] },
      { status: 400 },
    );
  }

  const phase =
    typeof json === "object" &&
    json !== null &&
    "phase" in json &&
    json.phase === "remint"
      ? "remint"
      : "full";

  if (phase === "remint") {
    const parsed = remintBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION",
          errors: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    try {
      const payment = await remintMontonioCheckoutPayment(parsed.data);
      return NextResponse.json({
        ok: true,
        redirect: payment.redirect,
        uuid: payment.uuid,
        paymentMethodId: payment.paymentMethodId,
      });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not create Montonio payment";

      return NextResponse.json(
        { ok: false, code: "REMINT_FAILED", errors: [message] },
        { status: 502 },
      );
    }
  }

  const parsed = fullBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        errors: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const { phase: _phase, ...checkoutBody } = parsed.data;
  const checkoutInput: CheckoutOrchestrateInput = {
    ...checkoutBody,
    sessionToken: readSessionToken(request, parsed.data.sessionToken),
  };

  const result = await orchestrateCheckout(checkoutInput);

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
