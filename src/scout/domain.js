import { hostname, normalizeTerm, slugify } from "./normalize.js";

const STOPWORDS = new Set([
  "a", "al", "de", "del", "el", "en", "la", "las", "los", "para", "por", "un", "una", "y",
  "an", "and", "for", "in", "of", "on", "the", "to", "with"
]);

function tokens(value) {
  return new Set(normalizeTerm(value).split(/[^\p{L}\p{N}]+/u).filter((token) => token && !STOPWORDS.has(token)));
}

function overlap(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter((token) => b.has(token)).length / Math.max(a.size, b.size);
}

const TERM_INTENT = [
  [/\b(comprar|precio|precios|cotizar|contratar)\b/u, "transactional"],
  [/\b(buy|purchase|price|pricing|cost|order|quote|for sale)\b/u, "transactional"],
  [/\b(mejor|mejores|comparativa|vs|econ[oó]mico|software|alternativa)\b/u, "commercial"],
  [/\b(best|top|vs|versus|comparison|compare|reviews?|alternative)\b/u, "commercial"],
  [/^(c[oó]mo|qu[eé]|por qu[eé]|gu[ií]a)\b/u, "informational"],
  [/^(how|what|why|which|guide|tutorial)\b/u, "informational"]
];

const SERP_INTENT = [
  [["shopping", "commercial_units", "popular_products"], "commercial"],
  [["local_pack"], "commercial"],
  [["featured_snippet", "people_also_ask", "knowledge_graph"], "informational"]
];

// RF-04: la clasificación combina modificadores del término con características
// de la SERP. Un término ambiguo se resuelve con la evidencia observada, no con
// una inferencia sobre el término aislado.
export function classifyIntent(term, serpFeatures = []) {
  for (const [pattern, intent] of TERM_INTENT) {
    if (pattern.test(term)) return intent;
  }
  const features = new Set(serpFeatures);
  for (const [markers, intent] of SERP_INTENT) {
    if (markers.some((marker) => features.has(marker))) return intent;
  }
  return "mixed";
}

function intentPoints(intent) {
  return { transactional: 15, commercial: 13, mixed: 8, informational: 5, navigational: 3 }[intent] ?? 0;
}

function demandPoints(volume, maxVolume) {
  if (volume === null || volume === undefined || maxVolume <= 0) return null;
  return Math.round((Math.log1p(volume) / Math.log1p(maxVolume)) * 25 * 100) / 100;
}

function competitionPoints(competition) {
  if (competition === null || competition === undefined) return null;
  return Math.round((1 - Math.min(100, Math.max(0, competition)) / 100) * 20 * 100) / 100;
}

export function buildResearchArtifacts(request, siteSignals, keywordSignals, serps, siteInventory = [], gaps = []) {
  const ownHost = request.site_url ? hostname(request.site_url) : null;
  const sitesByTerm = new Map();
  for (const signal of siteSignals) {
    const bucket = sitesByTerm.get(signal.term) ?? [];
    bucket.push(signal);
    sitesByTerm.set(signal.term, bucket);
  }
  const serpByTerm = new Map(serps.map((serp) => [serp.keyword, serp]));
  const candidatesByTerm = new Map();

  for (const signal of keywordSignals) {
    const existing = candidatesByTerm.get(signal.term);
    if (!existing || (signal.volume ?? -1) > (existing.volume ?? -1)) candidatesByTerm.set(signal.term, signal);
  }

  const maxVolume = Math.max(0, ...[...candidatesByTerm.values()].map((item) => item.volume ?? 0));
  const candidates = [...candidatesByTerm.values()].map((signal) => {
    const serp = serpByTerm.get(signal.term);
    const intent = classifyIntent(signal.term, serp?.features ?? []);
    const relevance = Math.round(overlap(signal.term, request.topic) * 30 * 100) / 100;
    const demand = demandPoints(signal.volume, maxVolume);
    const competition = competitionPoints(signal.competition);
    const intentFit = intentPoints(intent);
    const existing = sitesByTerm.get(signal.term) ?? [];
    const siteGap = existing.length ? 4 : 10;
    const components = { relevance, demand, competition, intent_fit: intentFit, site_gap: siteGap };
    const known = Object.values(components).filter((value) => value !== null);
    const score = Math.round(known.reduce((sum, value) => sum + value, 0) * 100) / 100;
    const coverage = known.length / Object.keys(components).length;
    const sourceIds = [signal.source_id];
    sourceIds.push(...existing.map((item) => item.source_id));
    if (serp) sourceIds.push(serp.source_id);
    return {
      term: signal.term,
      intent,
      volume: signal.volume,
      competition: signal.competition,
      components,
      score,
      coverage,
      disposition: existing.length > 1 ? "merge" : existing.length === 1 ? "update" : serp ? "build" : "watch",
      existing_url: existing[0]?.url,
      existing_urls: existing.map((item) => item.url),
      source_ids: sourceIds,
      serp
    };
  });

  candidates.sort((a, b) => b.score - a.score || b.components.relevance - a.components.relevance || a.term.localeCompare(b.term));

  // El vocabulario de clustering se deriva de la solicitud, no de una lista fija
  // de términos de un dominio concreto.
  const vocabulary = new Set([request.topic, ...(request.seed_keywords ?? [])].flatMap((value) => [...tokens(value)]));
  const clusters = new Map();
  for (const candidate of candidates) {
    const key = [...tokens(candidate.term)].filter((token) => vocabulary.has(token)).sort().join("-") || "general";
    const bucket = clusters.get(key) ?? [];
    bucket.push(candidate.term);
    clusters.set(key, bucket);
  }

  const sourceLedger = [
    ...siteSignals.map((item) => ledgerItem(item, { url: item.url })),
    ...keywordSignals.map((item) => ledgerItem(item)),
    ...serps.map((item) => ledgerItem(item, { keyword: item.keyword })),
    ...siteInventory.map((item) => ledgerItem(item, { url: item.url }))
  ];

  const competitors = [];
  const seen = new Set();
  for (const candidate of candidates) {
    for (const result of candidate.serp?.results ?? []) {
      if (ownHost && hostname(result.url) === ownHost) continue;
      if (!seen.has(result.url)) {
        seen.add(result.url);
        competitors.push(result.url);
      }
    }
  }

  return {
    sourceLedger,
    keywordMap: { candidates, clusters: [...clusters].map(([name, terms]) => ({ name, terms })) },
    competitors,
    siteInventory,
    gaps
  };
}

// Plantillas v0 por idioma. La derivación del outline a partir de los hallazgos
// sigue pendiente de decisión; ver SPECT-001 y el umbral de `spec.md`.
const OUTLINES = {
  es: ["Necesidad y contexto", "Criterios para elegir", "Solución recomendada", "Preguntas frecuentes"],
  en: ["Need and context", "How to choose", "Recommended solution", "Frequently asked questions"]
};

function outlineFor(locale) {
  return OUTLINES[String(locale ?? "").slice(0, 2).toLowerCase()] ?? OUTLINES.es;
}

export function assembleBrief(request, artifacts, metadata) {
  const eligible = artifacts.keywordMap.candidates.filter((candidate) => candidate.serp && candidate.coverage >= 0.8);
  const primary = eligible[0];
  if (!primary) {
    return {
      metadata,
      status: "failed",
      topic: request.topic,
      locale: request.locale,
      search_intent: "mixed",
      keywords: { primary: request.seed_keywords?.[0] ?? request.topic, secondary: [] },
      recommended_page: { page_type: "unknown", working_title: request.topic, slug: slugify(request.topic), outline: [request.topic] },
      evidence: artifacts.sourceLedger.map(toPublicEvidence),
      errors: [{ code: "INSUFFICIENT_EVIDENCE", message: "No valid SERP-backed keyword candidate was available.", retryable: true }]
    };
  }

  const secondary = eligible.slice(1, 8).map((candidate) => candidate.term);
  const clusters = artifacts.keywordMap.clusters
    .map((cluster) => ({ ...cluster, terms: cluster.terms.filter((term) => term === primary.term || secondary.includes(term)) }))
    .filter((cluster) => cluster.terms.length);
  const pageType = primary.intent === "commercial" ? "landing-page" : primary.intent === "transactional" ? "product-page" : "guide";
  const status = eligible.length >= 3 && artifacts.competitors.length >= 3 && artifacts.gaps.length === 0 ? "ready" : "partial";

  return {
    metadata,
    status,
    topic: request.topic,
    locale: request.locale,
    search_intent: primary.intent,
    keywords: { primary: primary.term, secondary, clusters },
    recommended_page: {
      page_type: pageType,
      working_title: titleCase(primary.term),
      slug: slugify(primary.term),
      outline: outlineFor(request.locale),
      conversion_goal: request.conversion_goal ?? "continuar al siguiente paso",
      internal_link_targets: [...new Set(artifacts.keywordMap.candidates.flatMap((candidate) => candidate.existing_urls ?? []))]
    },
    competitor_urls: artifacts.competitors.slice(0, 10),
    evidence: artifacts.sourceLedger.map(toPublicEvidence),
    assumptions: [
      artifacts.sourceLedger.some((item) => item.provider === "fixture")
        ? "Resultado generado exclusivamente con fixtures sintéticas de SPECT-001."
        : "Las métricas externas reflejan el momento observado y pueden cambiar.",
      ...artifacts.gaps
    ],
    errors: status === "partial" ? [{ code: "INSUFFICIENT_EVIDENCE", message: "The brief is usable but did not reach the ready evidence threshold.", retryable: true }] : []
  };
}

function toPublicEvidence(item) {
  return { source: `${item.provider}:${item.operation}:${item.source_id}`, ...(item.url ? { url: item.url } : {}), observed_at: item.observed_at, note: item.note };
}

function ledgerItem(item, context = {}) {
  const provider = item.provider ?? "unknown";
  const operation = item.operation ?? "unknown";
  const synthetic = provider === "fixture";
  return {
    source_id: item.source_id,
    provider,
    operation,
    observed_at: item.observed_at,
    ...(item.url ? { url: item.url } : {}),
    ...(item.task_id ? { task_id: item.task_id } : {}),
    note: synthetic
      ? `Synthetic fixture${context.keyword ? ` for ${context.keyword}` : ""}; not a real observation.`
      : `DataForSEO ${operation}${context.keyword ? ` for ${context.keyword}` : ""}.`
  };
}

function titleCase(value) {
  return value.replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}
