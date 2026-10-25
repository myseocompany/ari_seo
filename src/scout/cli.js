#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FixtureResearchProvider } from "./fixture-provider.js";
import { runScout } from "./run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath = process.argv[2] ?? path.join(root, "fixtures/scout/en-us-golden.json");
const provider = FixtureResearchProvider.fromFile(fixturePath);
const result = runScout(provider.fixture.request, provider);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === "failed" ? 1 : 0;
