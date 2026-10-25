import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateScoutRequest, validateSeoBrief } from "../src/scout/contracts.js";
import { classifyIntent } from "../src/scout/domain.js";
import { FixtureResearchProvider } from "../src/scout/fixture-provider.js";
import { runScout } from "../src/scout/run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "fixtures/scout/en-us-golden.json"), "utf8"));
const fixed = {
  now: () => "2026-10-24T12:00:00.000Z",
  id: () => "33333333-3333-4333-8333-333333333333"
};

function execute(data = fixture) {
  const provider = new FixtureResearchProvider(structuredClone(data));
  return { provider, result: runScout(provider.fixture.request, provider, fixed) };
}

test("valid ScoutRequest and golden SEOBrief satisfy their contracts", () => {
  const { result } = execute();
  assert.equal(validateScoutRequest(fixture.request), true);
  assert.equal(result.status, "ready");
  assert.equal(validateSeoBrief(result.brief), true);
});

// El brief dorado es la salida aprobada del pipeline sobre la fixture dorada.
// Cualquier desviación debe romper este test: si el cambio es intencional, se
// aprueba ejecutando `npm run golden:update` y el diff queda en el commit.
test("pipeline output matches the approved golden brief", () => {
  const approved = JSON.parse(fs.readFileSync(path.join(root, "fixtures/scout/en-us-golden.brief.json"), "utf8"));
  const { result } = execute();
  assert.deepEqual(result.brief, approved);
});

test("invalid request fails before any provider call", () => {
  const provider = new FixtureResearchProvider(structuredClone(fixture));
  const result = runScout({ topic: "missing required fields" }, provider, fixed);
  assert.equal(result.status, "failed");
  assert.equal(result.errors[0].code, "INVALID_REQUEST");
  assert.equal(provider.calls, 0);
});

test("same fixtures produce the same normalized output", () => {
  assert.deepEqual(execute().result, execute().result);
});

test("selected keywords and competitors retain source evidence", () => {
  const { result } = execute();
  const ledgerIds = new Set(result.artifacts.sourceLedger.map((item) => item.source_id));
  const selected = [result.brief.keywords.primary, ...result.brief.keywords.secondary];
  for (const term of selected) {
    const candidate = result.artifacts.keywordMap.candidates.find((item) => item.term === term);
    assert.ok(candidate.source_ids.some((sourceId) => ledgerIds.has(sourceId)));
    assert.ok(candidate.serp?.source_id);
  }
});

test("existing site query is marked update and linked internally", () => {
  const { result } = execute();
  const candidate = result.artifacts.keywordMap.candidates.find((item) => item.term === "empanada maker machine");
  assert.equal(candidate.disposition, "update");
  assert.ok(result.brief.recommended_page.internal_link_targets.includes("https://maquiempanadas.example/en/empanada-maker"));
});

test("own domain is never emitted as a competitor", () => {
  const { result } = execute();
  assert.equal(result.brief.competitor_urls.some((url) => new URL(url).hostname === "maquiempanadas.example"), false);
});

test("missing metrics remain unknown instead of becoming zero", () => {
  const { result } = execute();
  const candidate = result.artifacts.keywordMap.candidates.find((item) => item.term === "how to use an empanada machine");
  assert.equal(candidate.competition, null);
  assert.equal(candidate.components.competition, null);
  assert.ok(candidate.coverage < 1);
});

test("absence of valid SERPs returns failed with stable error", () => {
  const data = structuredClone(fixture);
  data.serps = [];
  const { result } = execute(data);
  assert.equal(result.status, "failed");
  assert.equal(result.brief.errors[0].code, "INSUFFICIENT_EVIDENCE");
  assert.equal(validateSeoBrief(result.brief), true);
});

test("insufficient optional evidence returns partial without invented competitors", () => {
  const data = structuredClone(fixture);
  data.serps = data.serps.slice(0, 1);
  const { result } = execute(data);
  assert.equal(result.status, "partial");
  assert.ok(result.brief.errors.length > 0);
  assert.ok(result.brief.competitor_urls.every((url) => data.serps[0].results.some((item) => item.url === url)));
});

test("intent combines term modifiers with observed SERP features", () => {
  // Un modificador explícito del término decide por sí solo.
  assert.equal(classifyIntent("buy empanada machine"), "transactional");
  assert.equal(classifyIntent("best empanada machine"), "commercial");
  assert.equal(classifyIntent("how to use an empanada machine"), "informational");
  assert.equal(classifyIntent("comprar laminadora de masa"), "transactional");
  // RF-04: un término ambiguo se resuelve con la evidencia de la SERP.
  assert.equal(classifyIntent("empanada machine"), "mixed");
  assert.equal(classifyIntent("empanada machine", ["shopping"]), "commercial");
  assert.equal(classifyIntent("empanada machine", ["people_also_ask"]), "informational");
  // El modificador del término tiene precedencia sobre las señales de SERP.
  assert.equal(classifyIntent("buy empanada machine", ["people_also_ask"]), "transactional");
});

test("every keyword belongs to exactly one cluster", () => {
  const { result } = execute();
  const owner = new Map();
  for (const cluster of result.artifacts.keywordMap.clusters) {
    for (const term of cluster.terms) {
      assert.equal(owner.has(term), false, `"${term}" aparece en más de un cluster`);
      owner.set(term, cluster.name);
    }
  }
  assert.equal(owner.size, result.artifacts.keywordMap.candidates.length);
});

test("trace_id is preserved end to end", () => {
  const { result } = execute();
  assert.equal(result.brief.metadata.trace_id, fixture.request.trace_id);
});
