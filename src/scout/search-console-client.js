import { ScoutProviderError } from "./errors.js";
import { canonicalUrl, normalizeTerm, stableId } from "./normalize.js";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class SearchConsoleClient {
  constructor({ accessToken, fetchImpl = globalThis.fetch, timeoutMs = 20000, maxRetries = 2, pageSize = 25000, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), now = () => new Date() }) {
    if (!accessToken) throw new ScoutProviderError("SEARCH_CONSOLE_AUTH_FAILED", "A Search Console access token is required.", { retryable: false });
    this.authorization = `Bearer ${accessToken}`;
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
    this.pageSize = pageSize;
    this.sleep = sleep;
    this.now = now;
  }

  async collect(request) {
    const maxRows = request.limits?.max_gsc_rows ?? 25000;
    const rowLimit = Math.min(this.pageSize, maxRows);
    const property = request.search_console_site_url ?? request.site_url;
    if (!property) return { signals: [], gap: "Search Console omitted because site_url was not provided." };
    const { startDate, endDate } = dateWindow(this.now());
    const rows = [];

    for (let startRow = 0; startRow < maxRows; startRow += rowLimit) {
      const remaining = maxRows - startRow;
      const body = { startDate, endDate, dimensions: ["query", "page"], rowLimit: Math.min(rowLimit, remaining), startRow, dataState: "final" };
      const data = await this.request(property, body);
      const page = data.rows ?? [];
      rows.push(...page);
      if (page.length < body.rowLimit) break;
    }

    const observedAt = this.now().toISOString();
    return {
      signals: rows.filter((row) => row.keys?.length >= 2).map((row) => {
        const normalized = {
          term: normalizeTerm(row.keys[0]),
          url: canonicalUrl(row.keys[1]),
          clicks: finiteOrNull(row.clicks),
          impressions: finiteOrNull(row.impressions),
          ctr: finiteOrNull(row.ctr),
          position: finiteOrNull(row.position),
          observed_at: observedAt,
          provider: "google-search-console",
          operation: "search_analytics"
        };
        normalized.source_id = stableId("src-gsc", normalized);
        return normalized;
      }),
      gap: null,
      window: { start_date: startDate, end_date: endDate }
    };
  }

  async request(property, body) {
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.fetch(url, {
          method: "POST",
          headers: { Authorization: this.authorization, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!response.ok) {
          const retryable = RETRYABLE.has(response.status);
          const code = response.status === 401 || response.status === 403 ? "SEARCH_CONSOLE_AUTH_FAILED" : response.status === 429 ? "SEARCH_CONSOLE_RATE_LIMITED" : "SEARCH_CONSOLE_UPSTREAM_ERROR";
          const error = new ScoutProviderError(code, `Search Console returned HTTP ${response.status}.`, { retryable, details: { http_status: response.status } });
          if (!retryable || attempt === this.maxRetries) throw error;
          await this.sleep(Math.min(2000, 250 * (2 ** attempt)));
          continue;
        }
        return await response.json();
      } catch (error) {
        if (error instanceof ScoutProviderError) throw error;
        const retryable = error?.name === "TimeoutError" || error?.name === "AbortError" || error instanceof TypeError;
        const wrapped = new ScoutProviderError("SEARCH_CONSOLE_UPSTREAM_ERROR", "Search Console timed out or the network failed.", { retryable, cause: error });
        if (!retryable || attempt === this.maxRetries) throw wrapped;
        await this.sleep(Math.min(2000, 250 * (2 ** attempt)));
      }
    }
  }
}

function dateWindow(now) {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
