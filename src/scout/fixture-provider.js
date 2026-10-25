import fs from "node:fs";
import { canonicalUrl, normalizeTerm, stableId } from "./normalize.js";

export class FixtureResearchProvider {
  constructor(fixture) {
    if (fixture.synthetic !== true) throw new Error("Fixture must be explicitly marked synthetic");
    this.fixture = fixture;
    this.calls = 0;
  }

  static fromFile(file) {
    return new FixtureResearchProvider(JSON.parse(fs.readFileSync(file, "utf8")));
  }

  getSiteQueries() {
    this.calls += 1;
    return this.fixture.site_queries.map((item) => ({
      ...item,
      term: normalizeTerm(item.term),
      url: canonicalUrl(item.url),
      provider: "fixture",
      operation: "site_queries",
      source_id: stableId("src-site", item)
    }));
  }

  expandKeywords() {
    this.calls += 1;
    return this.fixture.keywords.map((item) => ({
      ...item,
      term: normalizeTerm(item.term),
      provider: "fixture",
      operation: "keyword_expand",
      source_id: stableId("src-keyword", item)
    }));
  }

  getSerps() {
    this.calls += 1;
    return this.fixture.serps.map((serp) => ({
      ...serp,
      keyword: normalizeTerm(serp.keyword),
      results: serp.results.map((result) => ({ ...result, url: canonicalUrl(result.url) })),
      provider: "fixture",
      operation: "serp",
      source_id: stableId("src-serp", serp)
    }));
  }
}
