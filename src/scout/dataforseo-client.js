import { ScoutProviderError } from "./errors.js";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export class DataForSeoClient {
  constructor({
    login,
    password,
    baseUrl = "https://api.dataforseo.com",
    timeoutMs = 20000,
    maxRetries = 2,
    fetchImpl = globalThis.fetch,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    cache,
    budget,
    now = () => new Date().toISOString()
  }) {
    if (!login || !password) throw new ScoutProviderError("DATAFORSEO_AUTH_FAILED", "DataForSEO credentials are required.", { retryable: false });
    if (typeof fetchImpl !== "function") throw new TypeError("A fetch implementation is required");
    this.authorization = `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.cache = cache;
    this.budget = budget;
    this.now = now;
  }

  async request(endpoint, payload, { estimatedCostUsd, operation }) {
    const cached = this.cache?.get(endpoint, payload);
    if (cached) return { ...cached, cache_hit: true };
    this.budget?.reserve(estimatedCostUsd, operation);

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: { Authorization: this.authorization, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeoutMs)
        });

        if (!response.ok) {
          const retryable = RETRYABLE_STATUS.has(response.status);
          const code = response.status === 401 || response.status === 403
            ? "DATAFORSEO_AUTH_FAILED"
            : response.status === 429
              ? "DATAFORSEO_RATE_LIMITED"
              : "DATAFORSEO_UPSTREAM_ERROR";
          const error = new ScoutProviderError(code, `DataForSEO returned HTTP ${response.status}.`, {
            retryable,
            details: { http_status: response.status, operation }
          });
          if (!retryable || attempt === this.maxRetries) throw error;
          lastError = error;
          await this.sleep(backoff(attempt));
          continue;
        }

        const data = await response.json();
        validateEnvelope(data, operation);
        const reportedCost = (data.tasks ?? []).reduce((sum, task) => sum + (Number(task.cost) || 0), 0);
        this.budget?.report(reportedCost);
        const value = { data, observed_at: this.now(), reported_cost_usd: reportedCost, cache_hit: false };
        this.cache?.set(endpoint, payload, value);
        return value;
      } catch (error) {
        if (error instanceof ScoutProviderError) throw error;
        const retryable = error?.name === "TimeoutError" || error?.name === "AbortError" || error instanceof TypeError;
        const wrapped = new ScoutProviderError("DATAFORSEO_UPSTREAM_ERROR", retryable ? "DataForSEO request timed out or the network failed." : "DataForSEO response could not be processed.", {
          retryable,
          details: { operation },
          cause: error
        });
        if (!retryable || attempt === this.maxRetries) throw wrapped;
        lastError = wrapped;
        await this.sleep(backoff(attempt));
      }
    }
    throw lastError;
  }
}

function validateEnvelope(data, operation) {
  if (!data || typeof data !== "object") {
    throw new ScoutProviderError("DATAFORSEO_UPSTREAM_ERROR", "DataForSEO returned an invalid JSON envelope.", { retryable: false, details: { operation } });
  }
  if (data.status_code !== 20000) {
    throw taskError(data.status_code, data.status_message, operation);
  }
  for (const task of data.tasks ?? []) {
    if (task.status_code !== 20000) throw taskError(task.status_code, task.status_message, operation, task.id);
  }
}

function taskError(statusCode, statusMessage, operation, taskId) {
  const retryable = statusCode === 40209 || statusCode === 50301;
  return new ScoutProviderError(retryable ? "DATAFORSEO_RATE_LIMITED" : "DATAFORSEO_UPSTREAM_ERROR", "DataForSEO rejected a task.", {
    retryable,
    details: { status_code: statusCode, status_message: String(statusMessage ?? "").slice(0, 300), operation, ...(taskId ? { task_id: taskId } : {}) }
  });
}

function backoff(attempt) {
  return Math.min(2000, 250 * (2 ** attempt));
}
