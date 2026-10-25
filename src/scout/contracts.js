import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "contracts", name), "utf8"));
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const commonSchema = readSchema("common.schema.json");
ajv.addSchema(commonSchema);

export const validateScoutRequest = ajv.compile(readSchema("scout-request.schema.json"));
export const validateSeoBrief = ajv.compile(readSchema("seo-brief.schema.json"));

export function validationErrors(validate) {
  return (validate.errors ?? []).map((error) => ({
    path: error.instancePath || "/",
    rule: error.keyword,
    message: error.message
  }));
}
