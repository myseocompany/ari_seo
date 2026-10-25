import { randomUUID } from "node:crypto";
import { validateScoutRequest, validateSeoBrief, validationErrors } from "./contracts.js";
import { assembleBrief, buildResearchArtifacts } from "./domain.js";

export function runScout(request, provider, options = {}) {
  if (!validateScoutRequest(request)) {
    return {
      status: "failed",
      brief: null,
      artifacts: null,
      errors: [{ code: "INVALID_REQUEST", message: "ScoutRequest failed contract validation.", retryable: false, details: { validation: validationErrors(validateScoutRequest) } }]
    };
  }

  return runScoutWithSignals(request, {
    siteSignals: provider.getSiteQueries(request),
    keywordSignals: provider.expandKeywords(request),
    serps: provider.getSerps(request)
  }, options);
}

export function runScoutWithSignals(request, { siteSignals = [], keywordSignals = [], serps = [], siteInventory = [], gaps = [], usage = null }, options = {}) {
  if (!validateScoutRequest(request)) {
    return {
      status: "failed",
      brief: null,
      artifacts: null,
      errors: [{ code: "INVALID_REQUEST", message: "ScoutRequest failed contract validation.", retryable: false, details: { validation: validationErrors(validateScoutRequest) } }]
    };
  }

  const artifacts = { ...buildResearchArtifacts(request, siteSignals, keywordSignals, serps, siteInventory, gaps), usage };
  const now = options.now ?? (() => new Date().toISOString());
  const id = options.id ?? randomUUID;
  const metadata = { id: id(), contract_version: "1.0.0", trace_id: request.trace_id, created_at: now(), producer: "ari-scout" };
  const brief = assembleBrief(request, artifacts, metadata);

  if (!validateSeoBrief(brief)) {
    return {
      status: "failed",
      brief,
      artifacts,
      errors: [{ code: "CONTRACT_VALIDATION_FAILED", message: "SEOBrief failed contract validation.", retryable: false, details: { validation: validationErrors(validateSeoBrief) } }]
    };
  }

  return { status: brief.status, brief, artifacts, errors: brief.errors };
}
