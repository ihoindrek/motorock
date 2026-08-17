import { adminCorsPreflight, withAdminCors } from "@/lib/ai/api/admin-cors";

export function commerceAiOptions(request: Request) {
  return adminCorsPreflight(request);
}

export function commerceAiJson(
  request: Request,
  data: unknown,
  init?: ResponseInit,
) {
  return withAdminCors(request, Response.json(data, init));
}

export function commerceAiResponse(request: Request, response: Response) {
  return withAdminCors(request, response);
}
