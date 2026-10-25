// Regenera el brief dorado aprobado. Ejecutar deliberadamente cuando un cambio
// de scoring, clustering o ensamblaje deba quedar aprobado: el diff resultante
// es la evidencia de que la desviación fue intencional.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FixtureResearchProvider } from "../src/scout/fixture-provider.js";
import { runScout } from "../src/scout/run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixtures/scout/en-us-golden.json");
const output = path.join(root, "fixtures/scout/en-us-golden.brief.json");

// Reloj e identificador fijos: el brief dorado debe ser byte-estable.
const fixed = { now: () => "2026-10-24T12:00:00.000Z", id: () => "33333333-3333-4333-8333-333333333333" };

const provider = FixtureResearchProvider.fromFile(fixture);
const result = runScout(provider.fixture.request, provider, fixed);

if (result.status !== "ready") {
  console.error(`El brief dorado debe ser ready; se obtuvo "${result.status}".`);
  process.exit(1);
}

fs.writeFileSync(output, `${JSON.stringify(result.brief, null, 2)}\n`);
console.log(`Brief dorado escrito en ${path.relative(root, output)}`);
