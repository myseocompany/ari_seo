export class ScoutProviderError extends Error {
  constructor(code, message, { retryable = false, details = {}, cause } = {}) {
    super(message, { cause });
    this.name = "ScoutProviderError";
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }

  toContractError() {
    return { code: this.code, message: this.message, retryable: this.retryable, ...(Object.keys(this.details).length ? { details: this.details } : {}) };
  }
}

export function sanitizeProviderError(error) {
  if (error instanceof ScoutProviderError) return error;
  return new ScoutProviderError("DATAFORSEO_UPSTREAM_ERROR", "DataForSEO request failed.", { retryable: false, cause: error });
}
