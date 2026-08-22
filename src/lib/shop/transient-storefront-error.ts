/** Expected transient failure (e.g. Woo GraphQL blip) — do not page on-call. */
export class TransientStorefrontError extends Error {
  readonly transient = true as const;

  constructor(message: string) {
    super(message);
    this.name = "TransientStorefrontError";
  }
}

export function isTransientStorefrontError(
  error: unknown,
): error is TransientStorefrontError {
  return error instanceof TransientStorefrontError;
}
