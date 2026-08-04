import { AiEngineError } from "@/lib/ai/core/errors";

export function mapAiEngineErrorResponse(error: AiEngineError) {
  const status =
    error.code === "product_not_found"
      ? 404
      : error.code === "overwrite_conflict"
        ? 409
        : error.code === "not_configured"
          ? 503
          : 502;

  return Response.json(
    {
      ok: false,
      error: error.message,
      code: error.code,
    },
    { status },
  );
}
