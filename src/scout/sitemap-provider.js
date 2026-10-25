import { XMLParser, XMLValidator } from "fast-xml-parser";
import { ScoutProviderError } from "./errors.js";
import { canonicalUrl, stableId } from "./normalize.js";

export class SitemapInventoryProvider {
  constructor({ fetchImpl = globalThis.fetch, timeoutMs = 20000, maxDocuments = 50, maxBytes = 10 * 1024 * 1024, now = () => new Date().toISOString() } = {}) {
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxDocuments = maxDocuments;
    this.maxBytes = maxBytes;
    this.now = now;
    this.parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  }

  async collect(request, sitemapUrl) {
    if (!request.site_url) return { urls: [], gaps: ["Sitemap inventory omitted because site_url was not provided."] };
    const limit = request.limits?.max_site_urls ?? 10000;
    const start = sitemapUrl ?? new URL("/sitemap.xml", request.site_url).toString();
    const queue = [start];
    const visited = new Set();
    const urls = [];
    const seenUrls = new Set();
    const gaps = [];

    while (queue.length && visited.size < this.maxDocuments && urls.length < limit) {
      const current = validateHttpUrl(queue.shift());
      if (visited.has(current)) continue;
      visited.add(current);
      const xml = await this.fetchXml(current);
      let parsed;
      try {
        const validation = XMLValidator.validate(xml);
        if (validation !== true) throw new Error(validation.err?.msg ?? "Invalid XML");
        parsed = this.parser.parse(xml);
      } catch (error) {
        throw new ScoutProviderError("SITEMAP_INVALID_XML", "A sitemap could not be parsed as XML.", { retryable: false, details: { url: current }, cause: error });
      }

      if (parsed.sitemapindex) {
        for (const entry of array(parsed.sitemapindex.sitemap)) {
          if (entry?.loc && !visited.has(String(entry.loc))) queue.push(String(entry.loc));
        }
      } else if (parsed.urlset) {
        for (const entry of array(parsed.urlset.url)) {
          if (!entry?.loc) continue;
          const url = canonicalUrl(String(entry.loc));
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          const item = { url, lastmod: entry.lastmod ? String(entry.lastmod) : null, observed_at: this.now(), provider: "sitemap", operation: "inventory", sitemap_url: current };
          item.source_id = stableId("src-sitemap", item);
          urls.push(item);
          if (urls.length >= limit) break;
        }
      } else {
        gaps.push(`Unsupported sitemap document at ${current}`);
      }
    }

    if (queue.length) gaps.push("Sitemap traversal stopped at configured limits.");
    return { urls, gaps, documents: visited.size };
  }

  async fetchXml(url) {
    let response;
    try {
      response = await this.fetch(url, { headers: { Accept: "application/xml,text/xml;q=0.9" }, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (error) {
      throw new ScoutProviderError("SITEMAP_FETCH_FAILED", "A sitemap request timed out or the network failed.", { retryable: true, details: { url }, cause: error });
    }
    if (!response.ok) throw new ScoutProviderError("SITEMAP_FETCH_FAILED", `Sitemap returned HTTP ${response.status}.`, { retryable: response.status >= 500, details: { url, http_status: response.status } });
    const declared = Number(response.headers?.get?.("content-length"));
    if (Number.isFinite(declared) && declared > this.maxBytes) throw tooLarge(url);
    const xml = await response.text();
    if (Buffer.byteLength(xml) > this.maxBytes) throw tooLarge(url);
    return xml;
  }
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function validateHttpUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ScoutProviderError("SITEMAP_FETCH_FAILED", "Sitemap URL must use HTTP or HTTPS.", { retryable: false });
  return url.toString();
}

function tooLarge(url) {
  return new ScoutProviderError("SITEMAP_TOO_LARGE", "Sitemap exceeds the configured size limit.", { retryable: false, details: { url } });
}
