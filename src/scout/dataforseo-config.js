import path from "node:path";
import { BudgetGuard } from "./budget.js";
import { DataForSeoClient } from "./dataforseo-client.js";
import { DataForSeoResearchProvider } from "./dataforseo-provider.js";
import { FileCache } from "./file-cache.js";

export function createDataForSeoProvider(env = process.env, overrides = {}) {
  const cache = overrides.cache ?? new FileCache(
    env.DATAFORSEO_CACHE_DIR ?? path.resolve(".cache/ari-scout/dataforseo"),
    number(env.DATAFORSEO_CACHE_TTL_SECONDS, 86400)
  );
  const budget = overrides.budget ?? new BudgetGuard(overrides.budgetLimitUsd);
  const client = new DataForSeoClient({
    login: env.DATAFORSEO_LOGIN ?? env.DATAFORSEO_USER,
    password: env.DATAFORSEO_PASSWORD,
    baseUrl: env.DATAFORSEO_BASE_URL ?? "https://api.dataforseo.com",
    timeoutMs: number(env.DATAFORSEO_TIMEOUT_MS, 20000),
    maxRetries: number(env.DATAFORSEO_MAX_RETRIES, 2),
    cache,
    budget,
    ...(overrides.client ?? {})
  });
  return new DataForSeoResearchProvider(client, {
    keywordTaskEstimateUsd: number(env.DATAFORSEO_ESTIMATE_KEYWORDS_USD, 0.05),
    serpTaskEstimateUsd: number(env.DATAFORSEO_ESTIMATE_SERP_USD, 0.01)
  });
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
