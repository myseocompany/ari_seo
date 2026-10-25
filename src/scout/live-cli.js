#!/usr/bin/env node
import fs from "node:fs";
import { validateScoutRequest, validationErrors } from "./contracts.js";
import { createDataForSeoProvider } from "./dataforseo-config.js";
import { sanitizeProviderError, ScoutProviderError } from "./errors.js";
import { runScoutWithSignals } from "./run.js";
import { SearchConsoleClient } from "./search-console-client.js";
import { SitemapInventoryProvider } from "./sitemap-provider.js";

const requestPath = process.argv[2];
if (!requestPath) {
  process.stderr.write("Usage: node --env-file=.env src/scout/live-cli.js <request.json>\n");
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

  const dataForSeo = createDataForSeoProvider(process.env, { budgetLimitUsd: request.limits?.provider_budget_usd });
  const external = await dataForSeo.collect(request);
  const gaps = [];
  let siteSignals = [];
  let siteInventory = [];

  if (process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN) {
    try {
      const gsc = await new SearchConsoleClient({ accessToken: process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN }).collect(request);
      siteSignals = gsc.signals;
      if (gsc.gap) gaps.push(gsc.gap);
    } catch (error) {
      const safe = sanitizeProviderError(error);
      gaps.push(`${safe.code}: ${safe.message}`);
    }
  } else {
    gaps.push("Search Console omitted because GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN is not configured.");
  }

  if (request.site_url) {
    try {
      const inventory = await new SitemapInventoryProvider().collect(request, process.env.SCOUT_SITEMAP_URL);
      siteInventory = inventory.urls;
      gaps.push(...inventory.gaps);
    } catch (error) {
      const safe = sanitizeProviderError(error);
      gaps.push(`${safe.code}: ${safe.message}`);
    }
  }

  const result = runScoutWithSignals(request, { ...external, siteSignals, siteInventory, gaps });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "failed" ? 1 : 0;
} catch (error) {
  const safe = sanitizeProviderError(error).toContractError();
  process.stdout.write(`${JSON.stringify({ status: "failed", brief: null, artifacts: null, errors: [safe] }, null, 2)}\n`);
  process.exitCode = 1;
}
