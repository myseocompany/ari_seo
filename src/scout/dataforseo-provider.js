import { canonicalUrl, normalizeTerm, stableId } from "./normalize.js";

const KEYWORDS_ENDPOINT = "/v3/dataforseo_labs/google/keyword_suggestions/live";
const SERP_ENDPOINT = "/v3/serp/google/organic/live/advanced";

export class DataForSeoResearchProvider {
  constructor(client, { keywordTaskEstimateUsd = 0.05, serpTaskEstimateUsd = 0.01 } = {}) {
    this.client = client;
    this.keywordTaskEstimateUsd = keywordTaskEstimateUsd;
    this.serpTaskEstimateUsd = serpTaskEstimateUsd;
  }

  async collect(request) {
    const languageCode = request.locale.split("-")[0].toLowerCase();
    const limits = { max_keywords: 50, max_serp_queries: 10, ...request.limits };
    const seed = request.seed_keywords?.[0] ?? request.topic;
    const keywordPayload = [{
      keyword: seed,
      location_name: request.location,
      language_code: languageCode,
      include_seed_keyword: true,
      limit: limits.max_keywords
    }];
    const keywordResponse = await this.client.request(KEYWORDS_ENDPOINT, keywordPayload, {
      estimatedCostUsd: this.keywordTaskEstimateUsd,
      operation: "keyword_suggestions"
    });
    const keywordSignals = normalizeKeywords(keywordResponse);
    const queries = [...keywordSignals]
      .sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1) || a.term.localeCompare(b.term))
      .slice(0, limits.max_serp_queries);

    const serps = [];
    for (const item of queries) {
      const serpPayload = [{
        keyword: item.term,
        location_name: request.location,
        language_code: languageCode,
        device: "desktop",
        depth: 10
      }];
      const serpResponse = await this.client.request(SERP_ENDPOINT, serpPayload, {
        estimatedCostUsd: this.serpTaskEstimateUsd,
        operation: "organic_serp"
      });
      serps.push(...normalizeSerps(serpResponse));
    }

    return {
      siteSignals: [],
      keywordSignals,
      serps,
      usage: this.client.budget?.snapshot() ?? null
    };
  }
}

export function normalizeKeywords(response) {
  const signals = [];
  for (const task of response.data.tasks ?? []) {
    for (const result of task.result ?? []) {
      for (const item of result.items ?? []) {
        const data = item.keyword_data ?? item;
        const info = data.keyword_info ?? item.keyword_info ?? {};
        const term = data.keyword ?? item.keyword;
        if (!term) continue;
        const rawCompetition = info.competition;
        const competition = rawCompetition === null || rawCompetition === undefined
          ? null
          : rawCompetition <= 1 ? Math.round(rawCompetition * 100) : Math.round(rawCompetition);
        const normalized = {
          term: normalizeTerm(term),
          volume: finiteOrNull(info.search_volume),
          competition,
          observed_at: response.observed_at,
          provider: "dataforseo",
          operation: "keyword_suggestions",
          task_id: task.id
        };
        normalized.source_id = stableId("src-dfs-keyword", normalized);
        signals.push(normalized);
      }
    }
  }
  return signals;
}

export function normalizeSerps(response) {
  const serps = [];
  for (const task of response.data.tasks ?? []) {
    for (const result of task.result ?? []) {
      const keyword = result.keyword ?? task.data?.[0]?.keyword;
      if (!keyword) continue;
      const items = result.items ?? [];
      const organic = items
        .filter((item) => item.type === "organic" && item.url)
        .map((item) => ({ position: item.rank_group ?? item.rank_absolute, url: canonicalUrl(item.url), title: item.title ?? "" }));
      const normalized = {
        keyword: normalizeTerm(keyword),
        observed_at: response.observed_at,
        features: [...new Set(items.filter((item) => item.type && item.type !== "organic").map((item) => item.type))],
        results: organic,
        provider: "dataforseo",
        operation: "organic_serp",
        task_id: task.id
      };
      normalized.source_id = stableId("src-dfs-serp", normalized);
      serps.push(normalized);
    }
  }
  return serps;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
