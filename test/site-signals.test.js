import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SearchConsoleClient } from "../src/scout/search-console-client.js";
import { SitemapInventoryProvider } from "../src/scout/sitemap-provider.js";
import { FixtureResearchProvider } from "../src/scout/fixture-provider.js";
import { runScout, runScoutWithSignals } from "../src/scout/run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "fixtures/scout/en-us-golden.json"), "utf8"));
const fixed = { now: () => "2026-10-24T12:00:00.000Z", id: () => "33333333-3333-4333-8333-333333333333" };

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function xmlResponse(xml, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => String(Buffer.byteLength(xml)) }, text: async () => xml };
}

test("Search Console paginates and normalizes query/page rows", async () => {
  const requests = [];
  const pages = [
    { rows: [
      { keys: ["CRM Para Pymes", "https://example.com/crm"], clicks: 3, impressions: 100, ctr: 0.03, position: 8.5 },
      { keys: ["CRM Para Pymes", "https://example.com/crm-pymes"], clicks: 2, impressions: 80, ctr: 0.025, position: 11 }
    ] },
    { rows: [{ keys: ["software crm", "https://example.com/software"], clicks: 1, impressions: 20, ctr: 0.05, position: 15 }] }
  ];
  const client = new SearchConsoleClient({
    accessToken: "private-token",
    pageSize: 2,
    maxRetries: 0,
    now: () => new Date("2026-10-24T12:00:00Z"),
    fetchImpl: async (_url, options) => {
      requests.push({ headers: options.headers, body: JSON.parse(options.body) });
      return jsonResponse(pages.shift());
    }
  });
  const result = await client.collect({ site_url: "https://example.com", limits: { max_gsc_rows: 5 } });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.startDate, "2026-09-24");
  assert.equal(requests[0].body.endDate, "2026-10-21");
  assert.equal(result.signals.length, 3);
  assert.equal(result.signals[0].term, "crm para pymes");
  assert.equal(JSON.stringify(result).includes("private-token"), false);
});

test("Search Console authentication failures are not retried", async () => {
  let calls = 0;
  const client = new SearchConsoleClient({
    accessToken: "private-token",
    fetchImpl: async () => { calls += 1; return jsonResponse({}, 401); },
    maxRetries: 2
  });
  await assert.rejects(client.collect({ site_url: "https://example.com" }), (error) => error.code === "SEARCH_CONSOLE_AUTH_FAILED");
  assert.equal(calls, 1);
});

test("sitemap index resolves urlsets, deduplicates URLs and avoids cycles", async () => {
  const documents = new Map([
    ["https://example.com/sitemap.xml", `<?xml version="1.0"?><sitemapindex><sitemap><loc>https://example.com/pages.xml</loc></sitemap><sitemap><loc>https://example.com/sitemap.xml</loc></sitemap></sitemapindex>`],
    ["https://example.com/pages.xml", `<?xml version="1.0"?><urlset><url><loc>https://example.com/a</loc><lastmod>2026-10-01</lastmod></url><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>`]
  ]);
  const provider = new SitemapInventoryProvider({ fetchImpl: async (url) => xmlResponse(documents.get(url)), now: () => "2026-10-24T12:00:00Z" });
  const result = await provider.collect({ site_url: "https://example.com", limits: { max_site_urls: 10 } });
  assert.deepEqual(result.urls.map((item) => item.url), ["https://example.com/a", "https://example.com/b"]);
  assert.equal(result.documents, 2);
  assert.equal(result.urls[0].lastmod, "2026-10-01");
});

test("oversized sitemap fails with a stable error", async () => {
  const provider = new SitemapInventoryProvider({ maxBytes: 10, fetchImpl: async () => xmlResponse("<urlset></urlset>") });
  await assert.rejects(provider.collect({ site_url: "https://example.com" }), (error) => error.code === "SITEMAP_TOO_LARGE");
});

test("two existing pages for one query produce merge", () => {
  const data = structuredClone(fixture);
  data.site_queries.push({
    term: "empanada maker machine",
    url: "https://maquiempanadas.example/en/empanada-maker-duplicate",
    impressions: 90,
    position: 22,
    observed_at: "2026-10-20T00:00:00Z"
  });
  const provider = new FixtureResearchProvider(data);
  const result = runScout(provider.fixture.request, provider, fixed);
  const candidate = result.artifacts.keywordMap.candidates.find((item) => item.term === "empanada maker machine");
  assert.equal(candidate.disposition, "merge");
  assert.equal(candidate.existing_urls.length, 2);
});

test("missing Search Console is carried as an explicit partial gap", () => {
  const provider = new FixtureResearchProvider(structuredClone(fixture));
  const signals = {
    siteSignals: [],
    keywordSignals: provider.expandKeywords(),
    serps: provider.getSerps(),
    gaps: ["Search Console omitted because no access token is configured."]
  };
  const result = runScoutWithSignals(provider.fixture.request, signals, fixed);
  assert.equal(result.status, "partial");
  assert.ok(result.brief.assumptions.some((item) => item.includes("Search Console omitted")));
});
