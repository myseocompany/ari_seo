// Convierte respuestas reales de DataForSEO en fixtures grabadas y saneadas.
//
// Requisito de `spec.md`: "fixtures grabadas y sanitizadas para pruebas". Las
// fixtures escritas a mano ya produjeron un suite en verde contra una API
// imaginaria (ver SPECT-002-smoke.md), así que la forma de la respuesta debe
// provenir siempre de una grabación.
//
// Fuente: el caché de ejecuciones reales (`DATAFORSEO_CACHE_DIR`). Las fixtures
// fijan la FORMA de la respuesta del proveedor, no un tema de negocio: por eso
// siguen siendo válidas aunque la fixture dorada del pipeline use otro topic.
//
// Uso: node scripts/record-dataforseo-fixtures.mjs [directorio-de-cache]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.resolve(root, process.argv[2] ?? ".cache/ari-scout/dataforseo");
const outputDir = path.join(root, "fixtures/dataforseo");

// Los task id de DataForSEO incluyen un segmento de cuenta; se reemplazan por
// un placeholder de la misma forma para no publicar identidad de la cuenta.
const PLACEHOLDER_TASK_ID = "00000000-0000-0000-0000-000000000000";
const SECRET_KEYS = new Set(["authorization", "login", "password", "user", "api_key", "token"]);

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SECRET_KEYS.has(key.toLowerCase()))
        .map(([key, item]) => [key, key === "id" && typeof item === "string" ? PLACEHOLDER_TASK_ID : sanitize(item)])
    );
  }
  return value;
}

function write(name, entry) {
  const file = path.join(outputDir, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const recorded = {
    recorded_from: "respuesta real de DataForSEO, saneada por scripts/record-dataforseo-fixtures.mjs",
    recorded_at: entry.value.observed_at,
    data: sanitize(entry.value.data),
    observed_at: entry.value.observed_at,
    reported_cost_usd: entry.value.reported_cost_usd ?? null
  };
  fs.writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`);
  const task = recorded.data.tasks[0];
  console.log(`${name}: ${task.result[0].items.length} items, endpoint /${task.path.join("/")}`);
}

function slugify(value) {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

if (!fs.existsSync(cacheDir)) {
  console.error(`No existe el directorio de caché: ${cacheDir}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const entries = fs.readdirSync(cacheDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(cacheDir, file), "utf8")))
  .filter((entry) => entry?.value?.data?.tasks?.[0]?.status_code === 20000);

const labs = entries.find((entry) => entry.value.data.tasks[0].path.includes("dataforseo_labs"));
const serps = entries
  .filter((entry) => entry.value.data.tasks[0].path.includes("serp"))
  .sort((a, b) => a.value.observed_at.localeCompare(b.value.observed_at));

if (!labs || !serps.length) {
  console.error("El caché no contiene una respuesta válida de cada endpoint.");
  process.exit(1);
}

write("keyword-suggestions-live.json", labs);
for (const entry of serps) {
  const keyword = entry.value.data.tasks[0].result[0].keyword ?? entry.value.data.tasks[0].data?.[0]?.keyword;
  write(path.join("serp", `${slugify(keyword)}.json`), entry);
}

console.log(`\nFixtures escritas en ${path.relative(root, outputDir)}`);
