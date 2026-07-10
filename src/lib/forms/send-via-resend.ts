import {
  getFormFromAddress,
  isFormDryRun,
  resolveFormRecipient,
} from "@/lib/forms/config";
import { buildFormEmail, buildWithdrawalConfirmationEmail } from "@/lib/forms/build-email";
import type { FormSubmitPayload, FormSubmitResult } from "@/lib/forms/types";

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export async function sendFormViaResend(
  payload: FormSubmitPayload,
): Promise<FormSubmitResult> {
  const { subject, text } = buildFormEmail(payload);
  const to = resolveFormRecipient(
    payload.type,
    payload.type === "contact" ? { topic: payload.topic } : undefined,
  );
  const from = getFormFromAddress();

  if (isFormDryRun()) {
    console.info("[forms] dry-run email", {
      from,
      to,
      replyTo: payload.email,
      subject,
      text,
    });

    return { ok: true, dryRun: true };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    let detail = "Failed to send email";

    try {
      const body = (await response.json()) as ResendResponse;
      detail = body.message || body.name || detail;
    } catch {
      // ignore parse errors
    }

    console.error("[forms] Resend error:", response.status, detail);
    return { ok: false, error: detail };
  }

  if (payload.type === "withdrawal") {
    const confirmation = buildWithdrawalConfirmationEmail(payload);
    const confirmResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.email],
        subject: confirmation.subject,
        text: confirmation.text,
      }),
    });

    if (!confirmResponse.ok) {
      console.error(
        "[forms] withdrawal confirmation email failed:",
        confirmResponse.status,
      );
    }
  }

  return { ok: true };
}
