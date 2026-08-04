export class AiEngineError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_configured"
      | "not_implemented"
      | "product_not_found"
      | "overwrite_conflict"
      | "provider_error"
      | "validation_failed"
      | "write_failed",
  ) {
    super(message);
    this.name = "AiEngineError";
  }
}

export class AiNotImplementedError extends AiEngineError {
  constructor(feature: string) {
    super(`${feature} is not implemented yet (AI Engine scaffold).`, "not_implemented");
    this.name = "AiNotImplementedError";
  }
}
