import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BudgetGuard } from "../src/scout/budget.js";
import { DataForSeoClient } from "../src/scout/dataforseo-client.js";
import { DataForSeoResearchProvider, normalizeKeywords, normalizeSerps } from "../src/scout/dataforseo-provider.js";
import { FileCache } from "../src/scout/file-cache.js";
import { runScoutWithSignals } from "../src/scout/run.js";

// Las envolturas provienen de respuestas reales grabadas y saneadas por
// scripts/record-dataforseo-fixtures.mjs. No escribir envolturas a mano: la
// primera integración lo hizo y codificó una forma que la API no devuelve
// (ver SPECT-002-smoke.md).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recordingsDir = path.join(root, "fixtures/dataforseo");

function recording(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(recordingsDir, relativePath), "utf8"));
}

const keywordRecording = recording("keyword-suggestions-live.json");
const serpRecordings = fs.readdirSync(path.join(recordingsDir, "serp")).sort()
  .map((file) => recording(path.join("serp", file)));
const serpByKeyword = new Map(serpRecordings.map((item) => [item.data.tasks[0].result[0].keyword, item]));
const primarySerp = serpByKeyword.get("crm para pymes");
const observedAt = keywordRecording.observed_at;

function keywordEnvelope() {
  return structuredClone(keywordRecording.data);
}

function serpEnvelope(keyword) {
  const match = serpByKeyword.get(keyword) ?? serpRecordings[0];
  return structuredClone(match.data);
}

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

// Cliente de prueba que sirve la grabación correspondiente a la keyword pedida.
function recordedClient(calls = []) {
  return {
    budget: new BudgetGuard(1),
    async request(endpoint, payload) {
      calls.push({ endpoint, payload });
      if (endpoint.includes("keyword_suggestions")) return { data: keywordEnvelope(), observed_at: observedAt };
      return { data: serpEnvelope(payload[0].keyword), observed_at: observedAt };
    }
  };
}

test("client sends Basic authentication without exposing it in result", async () => {
  let headers;
  const client = new DataForSeoClient({
    login: "user@example.com",
    password: "secret-value",
    fetchImpl: async (_url, options) => { headers = options.headers; return response(keywordEnvelope()); },
    maxRetries: 0,
    now: () => observedAt
  });
  const result = await client.request("/keywords", [{}], { estimatedCostUsd: 0, operation: "keywords" });
  assert.equal(headers.Authorization, `Basic ${Buffer.from("user@example.com:secret-value").toString("base64")}`);
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});

test("recorded keyword response uses the flat item shape the API returns", () => {
  const [item] = keywordRecording.data.tasks[0].result[0].items;
  assert.equal("keyword_data" in item, false, "keyword_suggestions no envuelve en keyword_data");
  assert.ok("keyword" in item && "keyword_info" in item);
});

test("keyword response is normalized and missing metrics remain null", () => {
  const signals = normalizeKeywords({ data: keywordEnvelope(), observed_at: observedAt });
  assert.equal(signals.length, 19);
  assert.equal(signals[0].term, "crm para pymes");
  assert.equal(signals[0].volume, 40);
  assert.equal(signals[0].competition, 76, "competition 0..1 se escala a 0..100");
  assert.equal(signals.filter((item) => item.competition === null).length, 10);
  assert.equal(signals.filter((item) => item.volume === null).length, 2);
  assert.ok(signals.every((item) => item.source_id.startsWith("src-dfs-keyword-")));
  assert.ok(signals.every((item) => item.term === item.term.trim().toLowerCase()));
});

test("SERP normalization retains only organic results", () => {
  const [serp] = normalizeSerps({ data: structuredClone(primarySerp.data), observed_at: observedAt });
  const items = primarySerp.data.tasks[0].result[0].items;
  const organicUrls = new Set(items.filter((item) => item.type === "organic").map((item) => item.url));
  assert.equal(serp.keyword, "crm para pymes");
  assert.equal(serp.results.length, 8);
  assert.equal(serp.results.length, organicUrls.size);
  assert.deepEqual(serp.features, ["ai_overview", "video", "people_also_ask", "related_searches"]);
  assert.ok(serp.features.every((feature) => feature !== "organic"));
  assert.ok(serp.results.every((result) => !result.url.includes("#")));
});

test("provider limits one-task SERP requests to max_serp_queries", async () => {
  const calls = [];
  const provider = new DataForSeoResearchProvider(recordedClient(calls));
  const collected = await provider.collect({
    topic: "crm",
    locale: "es-CO",
    location: "Colombia",
    limits: { max_keywords: 20, max_serp_queries: 2 }
  });
  assert.equal(calls.length, 3);
  assert.equal(calls[1].payload.length, 1, "Live Advanced acepta una task por request");
  assert.equal(calls[2].payload.length, 1);
  assert.equal(collected.serps.length, 2);
  assert.deepEqual(collected.serps.map((item) => item.keyword), ["crm para pymes", "crm gratis para pymes"]);
});

test("budget exhaustion happens before fetch", async () => {
  let calls = 0;
  const client = new DataForSeoClient({
    login: "user",
    password: "password",
    fetchImpl: async () => { calls += 1; return response(keywordEnvelope()); },
    budget: new BudgetGuard(0.01),
    maxRetries: 0
  });
  await assert.rejects(
    client.request("/keywords", [{}], { estimatedCostUsd: 0.02, operation: "keywords" }),
    (error) => error.code === "BUDGET_EXHAUSTED"
  );
  assert.equal(calls, 0);
});

test("HTTP 429 retries within the configured bound", async () => {
  let calls = 0;
  const client = new DataForSeoClient({
    login: "user",
    password: "password",
    fetchImpl: async () => { calls += 1; return calls === 1 ? response({}, 429) : response(keywordEnvelope()); },
    sleep: async () => {},
    maxRetries: 1,
    now: () => observedAt
  });
  await client.request("/keywords", [{}], { estimatedCostUsd: 0, operation: "keywords" });
  assert.equal(calls, 2);
});

test("cache avoids a second network call and budget reservation", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ari-dfs-cache-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let calls = 0;
  const budget = new BudgetGuard(1);
  const client = new DataForSeoClient({
    login: "user",
    password: "password",
    fetchImpl: async () => { calls += 1; return response(keywordEnvelope()); },
    cache: new FileCache(directory, 3600),
    budget,
    maxRetries: 0,
    now: () => observedAt
  });
  const args = ["/keywords", [{}], { estimatedCostUsd: 0.05, operation: "keywords" }];
  const first = await client.request(...args);
  const second = await client.request(...args);
  assert.equal(first.cache_hit, false);
  assert.equal(second.cache_hit, true);
  assert.equal(calls, 1);
  assert.equal(budget.reservedUsd, 0.05);
});

// Sintética a propósito: el caché solo conserva respuestas exitosas, así que no
// existe una grabación real de un task fallido.
test("task errors are stable and credentials are sanitized", async () => {
  const failed = { status_code: 20000, tasks: [{ id: "bad-task", status_code: 40501, status_message: "Invalid field" }] };
  const client = new DataForSeoClient({
    login: "private-login",
    password: "private-password",
    fetchImpl: async () => response(failed),
    maxRetries: 0
  });
  await assert.rejects(
    client.request("/keywords", [{}], { estimatedCostUsd: 0, operation: "keywords" }),
    (error) => {
      assert.equal(error.code, "DATAFORSEO_UPSTREAM_ERROR");
      assert.equal(JSON.stringify(error.toContractError()).includes("private-password"), false);
      return true;
    }
  );
});

test("recorded fixtures carry no account identity", () => {
  for (const item of [keywordRecording, ...serpRecordings]) {
    assert.equal(item.data.tasks[0].id, "00000000-0000-0000-0000-000000000000");
  }
});

test("normalized DataForSEO signals produce a valid ready brief", async () => {
  const request = {
    request_id: "11111111-1111-4111-8111-111111111111",
    trace_id: "22222222-2222-4222-8222-222222222222",
    topic: "software crm para pymes",
    locale: "es-CO",
    location: "Colombia",
    seed_keywords: ["crm para pymes"],
    limits: { max_keywords: 20, max_serp_queries: 3, max_competitor_pages: 0, provider_budget_usd: 1 }
  };
  const signals = await new DataForSeoResearchProvider(recordedClient()).collect(request);
  const result = runScoutWithSignals(request, signals, {
    now: () => observedAt,
    id: () => "33333333-3333-4333-8333-333333333333"
  });
  assert.equal(result.status, "ready");
  assert.equal(result.brief.keywords.primary, "crm para pymes");
  assert.equal(result.brief.evidence.every((item) => item.source.startsWith("dataforseo:")), true);
  assert.equal(result.brief.assumptions.some((item) => item.includes("fixtures")), false);
});
