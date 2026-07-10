import type { FormSubmitPayload, FormSubmitResult } from "@/lib/forms/types";

export async function submitForm(
  payload: FormSubmitPayload,
): Promise<FormSubmitResult> {
  const response = await fetch("/api/forms/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as FormSubmitResult;

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      error: body.ok ? "Request failed" : body.error,
    };
  }

  return body;
}
