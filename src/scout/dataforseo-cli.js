#!/usr/bin/env node
import fs from "node:fs";
import { validateScoutRequest, validationErrors } from "./contracts.js";
import { createDataForSeoProvider } from "./dataforseo-config.js";
import { sanitizeProviderError, ScoutProviderError } from "./errors.js";
import { runScoutWithSignals } from "./run.js";

const requestPath = process.argv[2];
if (!requestPath) {
  process.stderr.write("Usage: node --env-file=.env src/scout/dataforseo-cli.js <request.json>\n");
  process.exit(2);
}

try {
  const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
  if (!validateScoutRequest(request)) {
    throw new ScoutProviderError("INVALID_REQUEST", "ScoutRequest failed contract validation.", {
      retryable: false,
      details: { validation: validationErrors(validateScoutRequest) }
    });
  }
  const provider = createDataForSeoProvider(process.env, { budgetLimitUsd: request.limits?.provider_budget_usd });
  const signals = await provider.collect(request);
  const result = runScoutWithSignals(request, signals);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "failed" ? 1 : 0;
} catch (error) {
  const safe = sanitizeProviderError(error).toContractError();
  process.stdout.write(`${JSON.stringify({ status: "failed", brief: null, artifacts: null, errors: [safe] }, null, 2)}\n`);
  process.exitCode = 1;
}
